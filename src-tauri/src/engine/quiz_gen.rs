use crate::models::quiz::{
    QuestionType, QuizQuestion, QuizResults, CategoryBreakdown, CategoryScore,
    ErrorEntry, ErrorCategory,
};
use crate::data::question_bank;

/// Topic info needed for question generation.
#[derive(Debug, Clone)]
pub struct TopicInfo {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub review_count: u32,
}

/// Generate quiz questions for the given topics.
/// Target distribution: 40% Recall, 35% Applied, 25% Synthesis.
/// Pulls real questions from the question bank when available.
pub fn generate_questions(
    topics: &[TopicInfo],
    total_questions: usize,
) -> Vec<QuizQuestion> {
    if topics.is_empty() || total_questions == 0 {
        return Vec::new();
    }

    let recall_count = (total_questions as f64 * 0.40).round() as usize;
    let applied_count = (total_questions as f64 * 0.35).round() as usize;
    let synthesis_count = total_questions - recall_count - applied_count;

    let mut questions = Vec::with_capacity(total_questions);
    let mut sort_order = 0;
    // Track which bank questions we've already used to avoid duplicates
    let mut used_bank_indices: std::collections::HashSet<usize> = std::collections::HashSet::new();

    let type_counts = [
        (QuestionType::Recall, recall_count, "recall"),
        (QuestionType::Applied, applied_count, "applied"),
        (QuestionType::Synthesis, synthesis_count, "synthesis"),
    ];

    for (q_type, count, type_str) in &type_counts {
        for i in 0..*count {
            let topic = &topics[i % topics.len()];
            let difficulty = compute_difficulty(q_type, topic.review_count);

            sort_order += 1;

            // Try to find a real question from the bank
            let bank_questions = question_bank::find_by_slug(&topic.slug);
            let bank_match = bank_questions.iter().enumerate().find(|(_, bq)| {
                bq.question_type == *type_str && !used_bank_indices.contains(&ptr_index(bq))
            });

            if let Some((_, bq)) = bank_match {
                used_bank_indices.insert(ptr_index(bq));
                let options_json = serde_json::to_string(&bq.options).ok();
                questions.push(QuizQuestion {
                    id: uuid::Uuid::new_v4().to_string(),
                    quiz_id: String::new(),
                    topic_id: Some(topic.id.clone()),
                    question_type: q_type.clone(),
                    difficulty: bq.difficulty,
                    question_text: bq.question_text.to_string(),
                    options_json,
                    correct_answer: bq.correct_answer.to_string(),
                    user_answer: None,
                    is_correct: None,
                    sort_order,
                });
            } else {
                // Fallback: generated question (no bank match)
                questions.push(QuizQuestion {
                    id: uuid::Uuid::new_v4().to_string(),
                    quiz_id: String::new(),
                    topic_id: Some(topic.id.clone()),
                    question_type: q_type.clone(),
                    difficulty,
                    question_text: format!(
                        "[{:?}] Question about {} (difficulty {:.1})",
                        q_type, topic.name, difficulty
                    ),
                    options_json: None,
                    correct_answer: format!("Answer for {}", topic.name),
                    user_answer: None,
                    is_correct: None,
                    sort_order,
                });
            }
        }
    }

    questions
}

/// Get a unique index for a bank question based on its pointer address.
fn ptr_index(bq: &question_bank::BankQuestion) -> usize {
    bq as *const question_bank::BankQuestion as usize
}

/// Compute difficulty based on question type and review count.
/// More reviews = lower difficulty (better known).
fn compute_difficulty(q_type: &QuestionType, review_count: u32) -> f64 {
    let base = match q_type {
        QuestionType::Recall => 0.3,
        QuestionType::Applied => 0.5,
        QuestionType::Synthesis => 0.8,
    };
    let review_factor = (1.0 - (review_count as f64 * 0.05)).max(0.2);
    (base * review_factor).clamp(0.1, 1.0)
}

/// Score a completed quiz, returning results with weighted scores and error taxonomy.
pub fn score_quiz(questions: &[QuizQuestion]) -> QuizResults {
    let total = questions.len() as u32;
    let mut correct_count: u32 = 0;
    let mut raw_correct: u32 = 0;
    let mut weighted_sum = 0.0;
    let mut weighted_max = 0.0;
    let mut errors = Vec::new();

    let mut recall_total: u32 = 0;
    let mut recall_correct: u32 = 0;
    let mut applied_total: u32 = 0;
    let mut applied_correct: u32 = 0;
    let mut synthesis_total: u32 = 0;
    let mut synthesis_correct: u32 = 0;

    for q in questions {
        let is_correct = q.is_correct.unwrap_or(false);
        weighted_max += q.difficulty;

        match q.question_type {
            QuestionType::Recall => {
                recall_total += 1;
                if is_correct { recall_correct += 1; }
            }
            QuestionType::Applied => {
                applied_total += 1;
                if is_correct { applied_correct += 1; }
            }
            QuestionType::Synthesis => {
                synthesis_total += 1;
                if is_correct { synthesis_correct += 1; }
            }
        }

        if is_correct {
            correct_count += 1;
            raw_correct += 1;
            weighted_sum += q.difficulty;
        } else {
            let category = classify_error(&q.question_type);
            errors.push(ErrorEntry {
                question_id: q.id.clone(),
                category,
                topic_name: q.topic_id.clone().unwrap_or_default(),
            });
        }
    }

    let raw_score = if total > 0 {
        raw_correct as f64 / total as f64 * 100.0
    } else {
        0.0
    };

    let weighted_score = if weighted_max > 0.0 {
        weighted_sum / weighted_max * 100.0
    } else {
        0.0
    };

    fn cat_score(total: u32, correct: u32) -> CategoryScore {
        CategoryScore {
            total,
            correct,
            score: if total > 0 { correct as f64 / total as f64 * 100.0 } else { 0.0 },
        }
    }

    QuizResults {
        quiz_id: String::new(),
        raw_score,
        weighted_score,
        total_questions: total,
        correct_count,
        category_breakdown: CategoryBreakdown {
            recall: cat_score(recall_total, recall_correct),
            applied: cat_score(applied_total, applied_correct),
            synthesis: cat_score(synthesis_total, synthesis_correct),
        },
        error_taxonomy: errors,
        rolling_4_week_avg: 0.0, // Computed by caller with historical data
        topics_to_review: Vec::new(), // Computed by caller
    }
}

/// Classify an error by question type.
fn classify_error(q_type: &QuestionType) -> ErrorCategory {
    match q_type {
        QuestionType::Recall => ErrorCategory::RecallFailure,
        QuestionType::Applied => ErrorCategory::ApplicationError,
        QuestionType::Synthesis => ErrorCategory::SynthesisGap,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_topics() -> Vec<TopicInfo> {
        vec![
            TopicInfo { id: "t1".into(), name: "Python for Data Science".into(), slug: "python-ds".into(), review_count: 3 },
            TopicInfo { id: "t2".into(), name: "SQL Fundamentals".into(), slug: "sql-fundamentals".into(), review_count: 1 },
            TopicInfo { id: "t3".into(), name: "Statistical Analysis".into(), slug: "statistics".into(), review_count: 0 },
        ]
    }

    #[test]
    fn test_generates_correct_total() {
        let topics = sample_topics();
        let questions = generate_questions(&topics, 20);
        assert_eq!(questions.len(), 20);
    }

    #[test]
    fn test_type_distribution_40_35_25() {
        let topics = sample_topics();
        let questions = generate_questions(&topics, 20);

        let recall = questions.iter().filter(|q| q.question_type == QuestionType::Recall).count();
        let applied = questions.iter().filter(|q| q.question_type == QuestionType::Applied).count();
        let synthesis = questions.iter().filter(|q| q.question_type == QuestionType::Synthesis).count();

        assert_eq!(recall, 8, "40% of 20 = 8 recall");
        assert_eq!(applied, 7, "35% of 20 = 7 applied");
        assert_eq!(synthesis, 5, "25% of 20 = 5 synthesis");
    }

    #[test]
    fn test_synthesis_harder_than_recall() {
        let topics = sample_topics();
        let questions = generate_questions(&topics, 20);

        let avg_recall: f64 = questions.iter()
            .filter(|q| q.question_type == QuestionType::Recall)
            .map(|q| q.difficulty)
            .sum::<f64>()
            / questions.iter().filter(|q| q.question_type == QuestionType::Recall).count() as f64;

        let avg_synthesis: f64 = questions.iter()
            .filter(|q| q.question_type == QuestionType::Synthesis)
            .map(|q| q.difficulty)
            .sum::<f64>()
            / questions.iter().filter(|q| q.question_type == QuestionType::Synthesis).count() as f64;

        assert!(avg_synthesis > avg_recall, "Synthesis should be harder than recall");
    }

    #[test]
    fn test_empty_topics_returns_empty() {
        let questions = generate_questions(&[], 10);
        assert!(questions.is_empty());
    }

    #[test]
    fn test_score_quiz_raw_vs_weighted() {
        let questions = vec![
            QuizQuestion {
                id: "q1".into(), quiz_id: "quiz1".into(), topic_id: Some("t1".into()),
                question_type: QuestionType::Recall, difficulty: 0.3,
                question_text: "Easy".into(), options_json: None,
                correct_answer: "A".into(), user_answer: Some("A".into()),
                is_correct: Some(true), sort_order: 1,
            },
            QuizQuestion {
                id: "q2".into(), quiz_id: "quiz1".into(), topic_id: Some("t2".into()),
                question_type: QuestionType::Synthesis, difficulty: 0.9,
                question_text: "Hard".into(), options_json: None,
                correct_answer: "B".into(), user_answer: Some("C".into()),
                is_correct: Some(false), sort_order: 2,
            },
        ];

        let results = score_quiz(&questions);
        assert_eq!(results.correct_count, 1);
        assert!((results.raw_score - 50.0).abs() < 1e-10, "1/2 = 50%");
        // Weighted: got 0.3 out of 1.2 total difficulty = 25%
        assert!(results.weighted_score < results.raw_score,
            "Missing hard question should lower weighted score");
    }

    #[test]
    fn test_error_taxonomy_categories() {
        let questions = vec![
            QuizQuestion {
                id: "q1".into(), quiz_id: "quiz1".into(), topic_id: Some("t1".into()),
                question_type: QuestionType::Recall, difficulty: 0.3,
                question_text: "Q".into(), options_json: None,
                correct_answer: "A".into(), user_answer: Some("B".into()),
                is_correct: Some(false), sort_order: 1,
            },
            QuizQuestion {
                id: "q2".into(), quiz_id: "quiz1".into(), topic_id: Some("t2".into()),
                question_type: QuestionType::Applied, difficulty: 0.5,
                question_text: "Q".into(), options_json: None,
                correct_answer: "A".into(), user_answer: Some("C".into()),
                is_correct: Some(false), sort_order: 2,
            },
        ];

        let results = score_quiz(&questions);
        assert_eq!(results.error_taxonomy.len(), 2);
        assert_eq!(results.error_taxonomy[0].category, ErrorCategory::RecallFailure);
        assert_eq!(results.error_taxonomy[1].category, ErrorCategory::ApplicationError);
    }
}
