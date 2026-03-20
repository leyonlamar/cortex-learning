use serde::Serialize;
use tauri::State;
use crate::commands::user::DbState;
use crate::error::AppError;
use crate::engine::{spaced_rep, bayesian, monte_carlo, rl_scheduler};
use crate::models::forecast::{DailyPlan, SpacedRepState};
use crate::db::queries;

#[tauri::command]
pub fn get_recall_probability(dt_hours: f64, memory_strength: f64) -> f64 {
    spaced_rep::recall_probability(dt_hours, memory_strength)
}

#[tauri::command]
pub fn update_spaced_rep(
    db: State<'_, DbState>,
    topic_id: String,
    score: f64,
    current_strength: f64,
) -> Result<(f64, f64), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let (new_strength, next_hours) = spaced_rep::update_strength(current_strength, score);
    let now = chrono::Utc::now().to_rfc3339();
    let next_review = chrono::Utc::now()
        + chrono::Duration::hours(next_hours as i64);
    let review_count: u32 = conn.query_row(
        "SELECT review_count FROM spaced_rep WHERE topic_id = ?1",
        rusqlite::params![topic_id],
        |row| row.get::<_, u32>(0),
    ).unwrap_or(0) + 1;
    queries::upsert_spaced_rep(
        &conn, &topic_id, new_strength,
        Some(&now), Some(&next_review.to_rfc3339()), review_count,
    )?;
    Ok((new_strength, next_hours))
}

#[tauri::command]
pub fn get_review_queue(recall_probs: Vec<f64>, limit: usize) -> Vec<usize> {
    spaced_rep::priority_queue(&recall_probs, limit)
}

#[tauri::command]
pub fn update_bayesian(
    db: State<'_, DbState>,
    topic_id: String,
    correct: bool,
    weight: f64,
) -> Result<(f64, f64), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let (alpha, beta) = match queries::get_bayesian_state(&conn, &topic_id) {
        Ok((a, b)) => (a, b),
        Err(_) => (1.0, 1.0),
    };
    let mut state = bayesian::BayesianState::from_params(alpha, beta);
    state.update(correct, weight);
    let now = chrono::Utc::now().to_rfc3339();
    queries::upsert_bayesian_state(&conn, &topic_id, state.alpha, state.beta_param, &now)?;
    Ok((state.mastery_mean(), state.uncertainty()))
}

#[tauri::command]
pub fn get_mastery(db: State<'_, DbState>, topic_id: String) -> Result<(f64, f64, f64, f64), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let (alpha, beta) = queries::get_bayesian_state(&conn, &topic_id)?;
    let state = bayesian::BayesianState::from_params(alpha, beta);
    let (ci_lower, ci_upper) = state.credible_interval_95();
    Ok((state.mastery_mean(), state.uncertainty(), ci_lower, ci_upper))
}

#[tauri::command]
pub fn run_forecast(
    db: State<'_, DbState>,
    attendance_rate: f64,
    quiz_avg: f64,
    weeks_remaining: u32,
    sim_count: u32,
) -> Result<(f64, f64, f64), AppError> {
    let params = monte_carlo::SimParams {
        current_attendance_rate: attendance_rate,
        current_quiz_avg: quiz_avg,
        weeks_remaining,
        attendance_volatility: 0.05,
        quiz_volatility: 5.0,
    };
    let result = monte_carlo::simulate(&params, sim_count, None);

    // Persist forecast result to the forecasts table
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let forecast_id = uuid::Uuid::new_v4().to_string();
    let computed_at = chrono::Utc::now().to_rfc3339();
    queries::insert_forecast(
        &conn,
        &forecast_id,
        &computed_at,
        sim_count,
        result.attendance.p10,
        result.attendance.median,
        result.attendance.p90,
        result.quiz_avg.p10,
        result.quiz_avg.median,
        result.quiz_avg.p90,
        result.completion_confidence,
    )?;

    Ok((
        result.attendance.median,
        result.quiz_avg.median,
        result.completion_confidence,
    ))
}

#[tauri::command]
pub fn get_daily_plan(
    db: State<'_, DbState>,
    topic_ids: Vec<String>,
) -> Result<DailyPlan, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;

    // Read RL state from DB or use defaults
    let rl_state = match conn.query_row(
        "SELECT current_week, attendance_streak, fatigue_proxy, review_backlog_size, quiz_trend FROM rl_state WHERE id = 1",
        [],
        |row| Ok(rl_scheduler::RlState {
            current_week: row.get(0)?,
            attendance_streak: row.get(1)?,
            fatigue_proxy: row.get(2)?,
            review_backlog_size: row.get(3)?,
            quiz_trend: row.get(4)?,
        }),
    ) {
        Ok(s) => s,
        Err(_) => rl_scheduler::RlState {
            current_week: 1,
            attendance_streak: 0,
            fatigue_proxy: 0.0,
            review_backlog_size: 0,
            quiz_trend: 0.0,
        },
    };

    let action = rl_scheduler::select_action(&rl_state, 0.1, None);
    Ok(rl_scheduler::generate_plan(action, topic_ids))
}

#[tauri::command]
pub fn get_review_stats(db: State<'_, DbState>) -> Result<Vec<SpacedRepState>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let rows = queries::get_all_spaced_rep(&conn)?;
    let now = chrono::Utc::now();
    let results = rows.into_iter().map(|(topic_id, strength, last_reviewed, next_review, review_count)| {
        let dt_hours = last_reviewed.as_ref().map(|lr| {
            chrono::DateTime::parse_from_rfc3339(lr)
                .map(|dt| (now - dt.with_timezone(&chrono::Utc)).num_hours() as f64)
                .unwrap_or(24.0)
        }).unwrap_or(24.0);
        let recall = spaced_rep::recall_probability(dt_hours, strength);
        SpacedRepState {
            topic_id,
            memory_strength: strength,
            last_reviewed,
            next_review,
            recall_probability: recall,
            review_count,
        }
    }).collect();
    Ok(results)
}

#[derive(Serialize)]
pub struct BehavioralAlert {
    pub id: String,
    pub alert_type: String,
    pub severity: String,
    pub message: String,
    pub created_at: String,
}

#[tauri::command]
pub fn get_behavioral_alerts(db: State<'_, DbState>) -> Result<Vec<BehavioralAlert>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let rows = queries::get_behavioral_alerts(&conn)?;
    let alerts = rows.into_iter().map(|(id, event_type, severity, details_json, date)| {
        BehavioralAlert {
            id,
            alert_type: event_type,
            severity,
            message: details_json,
            created_at: date,
        }
    }).collect();
    Ok(alerts)
}
