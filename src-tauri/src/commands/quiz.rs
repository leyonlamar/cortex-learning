use tauri::State;
use crate::commands::user::DbState;
use crate::error::AppError;
use crate::models::quiz::{Quiz, QuizQuestion, QuizResults};
use crate::engine::quiz_gen::{self, TopicInfo};
use crate::db::queries;

#[tauri::command]
pub fn generate_quiz(
    db: State<'_, DbState>,
    week_id: String,
    topics: Vec<(String, String, String, u32)>,  // (id, name, slug, review_count)
    total_questions: usize,
) -> Result<Quiz, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;

    let topic_infos: Vec<TopicInfo> = topics.into_iter().map(|(id, name, slug, rc)| {
        TopicInfo { id, name, slug, review_count: rc }
    }).collect();

    let mut questions = quiz_gen::generate_questions(&topic_infos, total_questions);
    let quiz_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Local::now().format("%Y-%m-%d").to_string();

    for q in &mut questions {
        q.quiz_id = quiz_id.clone();
    }

    let quiz = Quiz {
        id: quiz_id.clone(),
        week_id: week_id.clone(),
        date: now,
        status: "pending".into(),
        total_score: None,
        difficulty_weighted_score: None,
        time_spent_min: None,
        completed_at: None,
        questions: questions.clone(),
    };

    queries::insert_quiz(&conn, &quiz)?;
    for q in &questions {
        queries::insert_quiz_question(&conn, q)?;
    }

    Ok(quiz)
}

#[tauri::command]
pub fn submit_quiz_answer(
    db: State<'_, DbState>,
    question_id: String,
    user_answer: String,
) -> Result<bool, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;

    let correct_answer: String = conn.query_row(
        "SELECT correct_answer FROM quiz_questions WHERE id = ?1",
        rusqlite::params![question_id],
        |row| row.get(0),
    ).map_err(|e| AppError::Database(e.to_string()))?;

    let is_correct = user_answer.trim().eq_ignore_ascii_case(correct_answer.trim());

    conn.execute(
        "UPDATE quiz_questions SET user_answer = ?1, is_correct = ?2 WHERE id = ?3",
        rusqlite::params![user_answer, is_correct, question_id],
    )?;

    Ok(is_correct)
}

#[tauri::command]
pub fn complete_quiz(
    db: State<'_, DbState>,
    quiz_id: String,
) -> Result<QuizResults, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;

    // Fetch all questions for this quiz
    let mut stmt = conn.prepare(
        "SELECT id, quiz_id, topic_id, question_type, difficulty, question_text,
         options_json, correct_answer, user_answer, is_correct, sort_order
         FROM quiz_questions WHERE quiz_id = ?1 ORDER BY sort_order"
    )?;

    let questions: Vec<QuizQuestion> = stmt.query_map(rusqlite::params![quiz_id], |row| {
        let qt_str: String = row.get(3)?;
        let question_type = serde_json::from_str(&format!("\"{}\"", qt_str))
            .unwrap_or(crate::models::quiz::QuestionType::Recall);
        Ok(QuizQuestion {
            id: row.get(0)?,
            quiz_id: row.get(1)?,
            topic_id: row.get(2)?,
            question_type,
            difficulty: row.get(4)?,
            question_text: row.get(5)?,
            options_json: row.get(6)?,
            correct_answer: row.get(7)?,
            user_answer: row.get(8)?,
            is_correct: row.get(9)?,
            sort_order: row.get(10)?,
        })
    })?.filter_map(|r| r.ok()).collect();

    let mut results = quiz_gen::score_quiz(&questions);
    results.quiz_id = quiz_id.clone();

    let now = chrono::Utc::now().to_rfc3339();
    queries::complete_quiz(&conn, &quiz_id, results.raw_score, results.weighted_score, &now)?;

    // Compute rolling 4-week average from recent completed quizzes
    let _week_id: String = conn.query_row(
        "SELECT week_id FROM quizzes WHERE id = ?1",
        rusqlite::params![quiz_id],
        |row| row.get(0),
    ).unwrap_or_default();
    let recent_scores: Vec<f64> = {
        let mut stmt = conn.prepare(
            "SELECT total_score FROM quizzes WHERE status = 'completed' AND total_score IS NOT NULL ORDER BY date DESC LIMIT 4"
        ).unwrap();
        stmt.query_map([], |row| row.get::<_, f64>(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect()
    };
    if !recent_scores.is_empty() {
        results.rolling_4_week_avg = recent_scores.iter().sum::<f64>() / recent_scores.len() as f64;
    }

    // Extract topics to review from error taxonomy (unique topic IDs from wrong answers)
    let mut seen = std::collections::HashSet::new();
    for err in &results.error_taxonomy {
        if seen.insert(err.topic_name.clone()) {
            results.topics_to_review.push(err.topic_name.clone());
        }
    }

    Ok(results)
}
