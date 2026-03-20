use tauri::State;
use crate::commands::user::DbState;
use crate::error::AppError;
use crate::models::session::{Session, SessionPhase, PhaseType, WeeklyAggregate};
use crate::db::queries;
use crate::engine::{rl_scheduler, behavioral, spaced_rep, bayesian};

#[tauri::command]
pub fn get_session(db: State<'_, DbState>, session_id: String) -> Result<Session, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    queries::get_session(&conn, &session_id)
}

#[tauri::command]
pub fn get_session_phases(db: State<'_, DbState>, session_id: String) -> Result<Vec<SessionPhase>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    queries::get_phases(&conn, &session_id)
}

#[tauri::command]
pub fn complete_phase(
    db: State<'_, DbState>,
    session_id: String,
    phase: String,
    duration_min: i32,
    content: Option<String>,
    score: Option<f64>,
    sort_order: i32,
) -> Result<(), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let phase_type: PhaseType = serde_json::from_str(&format!("\"{}\"", phase))
        .map_err(|e| AppError::Validation(e.to_string()))?;
    let sp = SessionPhase {
        id: uuid::Uuid::new_v4().to_string(),
        session_id,
        phase: phase_type,
        duration_min: Some(duration_min),
        content,
        score,
        sort_order,
    };
    queries::insert_phase(&conn, &sp)
}

#[tauri::command]
pub fn complete_session(
    db: State<'_, DbState>,
    session_id: String,
    time_spent_min: i32,
    retrieval_score: f64,
    confidence: i32,
    energy_level: i32,
    notes: Option<String>,
) -> Result<(), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let now = chrono::Utc::now().to_rfc3339();
    queries::complete_session(
        &conn,
        &session_id,
        time_spent_min,
        retrieval_score,
        confidence,
        energy_level,
        notes.as_deref(),
        &now,
    )?;

    // ── Wire RL reward ───────────────────────────────────────────────
    let rl_state = match conn.query_row(
        "SELECT current_week, attendance_streak, fatigue_proxy, review_backlog_size, quiz_trend FROM rl_state WHERE id = 1",
        [],
        |row| {
            Ok(rl_scheduler::RlState {
                current_week: row.get(0)?,
                attendance_streak: row.get(1)?,
                fatigue_proxy: row.get(2)?,
                review_backlog_size: row.get(3)?,
                quiz_trend: row.get(4)?,
            })
        },
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

    let reward = rl_scheduler::compute_reward(retrieval_score, time_spent_min as u32, energy_level);
    let new_streak = rl_state.attendance_streak + 1;
    let new_fatigue = (rl_state.fatigue_proxy + 0.05).min(1.0);
    // Use reward to nudge quiz_trend: blend toward (reward - 0.5) scaled
    let new_quiz_trend = rl_state.quiz_trend * 0.8 + (reward - 0.5) * 0.2;
    queries::upsert_rl_state(
        &conn,
        rl_state.current_week,
        new_streak,
        new_fatigue,
        rl_state.review_backlog_size,
        new_quiz_trend,
        &now,
    )?;

    // ── Wire behavioral engine ───────────────────────────────────────
    let mut beh_state = queries::load_behavioral_state(&conn).unwrap_or_else(|_| {
        behavioral::BehavioralState::new()
    });
    let alerts = behavioral::record_attendance(&mut beh_state, true);
    queries::upsert_behavioral_state(&conn, &beh_state, &now)?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    for alert in &alerts {
        let alert_id = uuid::Uuid::new_v4().to_string();
        let severity_str = match alert.severity {
            behavioral::AlertSeverity::Info => "info",
            behavioral::AlertSeverity::Warning => "warning",
            behavioral::AlertSeverity::Critical => "critical",
        };
        queries::insert_behavioral_alert(&conn, &alert_id, &today, &alert.event_type, severity_str, None)?;
    }

    // ── Feed spaced rep and Bayesian engines ─────────────────────────
    // Get topic IDs from the session's topics_json field.
    let session_for_topics = queries::get_session(&conn, &session_id)?;
    let topic_ids: Vec<String> = session_for_topics
        .topics_json
        .as_deref()
        .and_then(|s| serde_json::from_str::<Vec<String>>(s).ok())
        .unwrap_or_default();

    // Normalize confidence (1-5 i32) to a Bayesian weight (0.2-1.0).
    let bayesian_weight = (confidence as f64 / 5.0).clamp(0.01, 1.0);
    let correct = retrieval_score > 0.5;

    for topic_id in &topic_ids {
        // Spaced rep update
        let current_strength = conn.query_row(
            "SELECT memory_strength FROM spaced_rep WHERE topic_id = ?1",
            rusqlite::params![topic_id],
            |row| row.get::<_, f64>(0),
        ).unwrap_or(1.0);
        let (new_strength, next_hours) = spaced_rep::update_strength(current_strength, retrieval_score);
        let next_review = chrono::Utc::now()
            + chrono::Duration::hours(next_hours as i64);
        let review_count: u32 = conn.query_row(
            "SELECT review_count FROM spaced_rep WHERE topic_id = ?1",
            rusqlite::params![topic_id],
            |row| row.get::<_, u32>(0),
        ).unwrap_or(0) + 1;
        queries::upsert_spaced_rep(
            &conn, topic_id, new_strength,
            Some(&now), Some(&next_review.to_rfc3339()), review_count,
        )?;

        // Bayesian update
        let (alpha, beta_val) = queries::get_bayesian_state(&conn, topic_id)
            .unwrap_or((1.0, 1.0));
        let mut bay_state = bayesian::BayesianState::from_params(alpha, beta_val);
        bay_state.update(correct, bayesian_weight);
        queries::upsert_bayesian_state(
            &conn, topic_id, bay_state.alpha, bay_state.beta_param, &now,
        )?;
    }

    // ── Compute weekly aggregate ─────────────────────────────────────
    let session = queries::get_session(&conn, &session_id)?;
    let week_id = session.week_id.clone();
    let total_min: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(time_spent_min), 0) FROM sessions WHERE week_id = ?1 AND status = 'completed'",
            rusqlite::params![week_id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    let (completed_count, total_count): (i64, i64) = conn
        .query_row(
            "SELECT COUNT(CASE WHEN status='completed' THEN 1 END), COUNT(*) FROM sessions WHERE week_id = ?1",
            rusqlite::params![week_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap_or((0, 1));
    let quiz_score: Option<f64> = conn
        .query_row(
            "SELECT total_score FROM quizzes WHERE week_id = ?1 AND status = 'completed'",
            rusqlite::params![week_id],
            |row| row.get(0),
        )
        .ok();
    let attendance_rate = if total_count > 0 {
        completed_count as f64 / total_count as f64
    } else {
        0.0
    };
    // ── Compute mastery_delta ────────────────────────────────────────
    let current_avg_mastery = queries::get_avg_mastery(&conn).unwrap_or(0.0);
    let prev_mastery = queries::get_weekly_aggregate(&conn, &week_id)
        .and_then(|prev| prev.mastery_delta)
        .unwrap_or(0.0);
    // mastery_delta = current avg mastery minus the previous aggregate's mastery snapshot.
    // On first write prev_mastery is 0 so delta equals current_avg_mastery.
    let mastery_delta = current_avg_mastery - prev_mastery;
    let trend_direction = if mastery_delta > 0.02 {
        Some("improving".to_string())
    } else if mastery_delta < -0.02 {
        Some("declining".to_string())
    } else {
        Some("stable".to_string())
    };

    let agg = WeeklyAggregate {
        week_id,
        total_hours: Some(total_min as f64 / 60.0),
        quiz_score,
        mastery_delta: Some(mastery_delta),
        trend_direction,
        variance_from_projection: None,
        attendance_rate: Some(attendance_rate),
        computed_at: now,
    };
    queries::upsert_weekly_aggregate(&conn, &agg)?;

    Ok(())
}

#[tauri::command]
pub fn get_session_history(db: State<'_, DbState>, week_id: String) -> Result<Vec<Session>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id FROM sessions WHERE week_id = ?1 ORDER BY date"
    )?;
    let ids: Vec<String> = stmt
        .query_map(rusqlite::params![week_id], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();

    let mut sessions = Vec::new();
    for id in ids {
        sessions.push(queries::get_session(&conn, &id)?);
    }
    Ok(sessions)
}
