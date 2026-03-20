#![allow(dead_code)]
use rusqlite::{params, Connection};
use crate::error::AppError;
use crate::models::user::{User, Theme};
use crate::models::topic::{Domain, Topic};
use crate::models::session::{Session, SessionStatus, SessionPhase, PhaseType, Week, WeeklyAggregate};
use crate::models::quiz::{Quiz, QuizQuestion};

// ── User CRUD ──────────────────────────────────────────────────────────

pub fn create_user(conn: &Connection, user: &User) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO user_profile (id, name, email, avatar_seed, theme, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![user.id, user.name, user.email, user.avatar_seed, user.theme.as_str(), user.created_at, user.updated_at],
    )?;
    Ok(())
}

pub fn get_user(conn: &Connection, id: &str) -> Result<User, AppError> {
    conn.query_row(
        "SELECT id, name, email, avatar_seed, theme, created_at, updated_at FROM user_profile WHERE id = ?1",
        params![id],
        |row| {
            let theme_str: String = row.get(4)?;
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                avatar_seed: row.get(3)?,
                theme: theme_str.parse::<Theme>().unwrap_or_default(),
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("User {} not found", id)),
        e => AppError::Database(e.to_string()),
    })
}

pub fn list_users(conn: &Connection) -> Result<Vec<User>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, email, avatar_seed, theme, created_at, updated_at FROM user_profile ORDER BY created_at ASC"
    )?;
    let rows = stmt.query_map([], |row| {
        let theme_str: String = row.get(4)?;
        Ok(User {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            avatar_seed: row.get(3)?,
            theme: theme_str.parse::<Theme>().unwrap_or_default(),
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

pub fn update_user_theme(conn: &Connection, user_id: &str, theme: &Theme) -> Result<(), AppError> {
    let rows = conn.execute(
        "UPDATE user_profile SET theme = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![theme.as_str(), user_id],
    )?;
    if rows == 0 {
        return Err(AppError::NotFound(format!("User {} not found", user_id)));
    }
    Ok(())
}

// ── Domain & Topic CRUD ────────────────────────────────────────────────

pub fn seed_domains(conn: &Connection, domains: &[Domain]) -> Result<(), AppError> {
    let mut stmt = conn.prepare(
        "INSERT OR IGNORE INTO domains (id, name, slug, color, icon, sort_order, is_custom)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    )?;
    for d in domains {
        stmt.execute(params![d.id, d.name, d.slug, d.color, d.icon, d.sort_order, d.is_custom])?;
    }
    Ok(())
}

pub fn get_domains(conn: &Connection) -> Result<Vec<Domain>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, slug, color, icon, sort_order, is_custom FROM domains ORDER BY sort_order"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Domain {
            id: row.get(0)?,
            name: row.get(1)?,
            slug: row.get(2)?,
            color: row.get(3)?,
            icon: row.get(4)?,
            sort_order: row.get(5)?,
            is_custom: row.get(6)?,
        })
    })?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

pub fn insert_topic(conn: &Connection, topic: &Topic) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO topics (id, domain_id, parent_id, name, slug, depth, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![topic.id, topic.domain_id, topic.parent_id, topic.name, topic.slug, topic.depth, topic.created_at],
    )?;
    Ok(())
}

/// Seed default topics for all domains. Looks up domain IDs by slug and creates topics.
pub fn seed_default_topics(conn: &Connection) -> Result<(), AppError> {
    let domains = get_domains(conn)?;
    let default_topics = crate::models::topic::default_topics();
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    for (domain_slug, topic_name, topic_slug) in &default_topics {
        if let Some(domain) = domains.iter().find(|d| d.slug == *domain_slug) {
            let topic = Topic {
                id: uuid::Uuid::new_v4().to_string(),
                domain_id: domain.id.clone(),
                parent_id: None,
                name: topic_name.to_string(),
                slug: topic_slug.to_string(),
                depth: 0,
                created_at: now.clone(),
            };
            // INSERT OR IGNORE to be idempotent
            conn.execute(
                "INSERT OR IGNORE INTO topics (id, domain_id, parent_id, name, slug, depth, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![topic.id, topic.domain_id, topic.parent_id, topic.name, topic.slug, topic.depth, topic.created_at],
            )?;
        }
    }
    Ok(())
}

pub fn get_topics_by_domain(conn: &Connection, domain_id: &str) -> Result<Vec<Topic>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, domain_id, parent_id, name, slug, depth, created_at FROM topics WHERE domain_id = ?1 ORDER BY depth, name"
    )?;
    let rows = stmt.query_map(params![domain_id], |row| {
        Ok(Topic {
            id: row.get(0)?,
            name: row.get(3)?,
            domain_id: row.get(1)?,
            parent_id: row.get(2)?,
            slug: row.get(4)?,
            depth: row.get(5)?,
            created_at: row.get(6)?,
        })
    })?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

// ── Session CRUD ───────────────────────────────────────────────────────

pub fn insert_session(conn: &Connection, s: &Session) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO sessions (id, week_id, date, day_of_week, status, rescheduled_to,
         topics_json, tags_json, time_spent_min, retrieval_score, confidence, energy_level, notes, completed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            s.id, s.week_id, s.date, s.day_of_week,
            serde_json::to_string(&s.status).unwrap_or_default().trim_matches('"'),
            s.rescheduled_to, s.topics_json, s.tags_json,
            s.time_spent_min, s.retrieval_score, s.confidence, s.energy_level, s.notes, s.completed_at
        ],
    )?;
    Ok(())
}

pub fn get_session(conn: &Connection, id: &str) -> Result<Session, AppError> {
    conn.query_row(
        "SELECT id, week_id, date, day_of_week, status, rescheduled_to,
         topics_json, tags_json, time_spent_min, retrieval_score, confidence, energy_level, notes, completed_at
         FROM sessions WHERE id = ?1",
        params![id],
        |row| {
            let status_str: String = row.get(4)?;
            let status = match status_str.as_str() {
                "completed" => SessionStatus::Completed,
                "missed" => SessionStatus::Missed,
                "rescheduled" => SessionStatus::Rescheduled,
                _ => SessionStatus::Scheduled,
            };
            Ok(Session {
                id: row.get(0)?,
                week_id: row.get(1)?,
                date: row.get(2)?,
                day_of_week: row.get(3)?,
                status,
                rescheduled_to: row.get(5)?,
                topics_json: row.get(6)?,
                tags_json: row.get(7)?,
                time_spent_min: row.get(8)?,
                retrieval_score: row.get(9)?,
                confidence: row.get(10)?,
                energy_level: row.get(11)?,
                notes: row.get(12)?,
                completed_at: row.get(13)?,
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Session {} not found", id)),
        e => AppError::Database(e.to_string()),
    })
}

pub fn update_session_status(conn: &Connection, id: &str, status: &SessionStatus) -> Result<(), AppError> {
    let status_str = serde_json::to_string(status).unwrap_or_default();
    let status_str = status_str.trim_matches('"');
    conn.execute(
        "UPDATE sessions SET status = ?1 WHERE id = ?2",
        params![status_str, id],
    )?;
    Ok(())
}

pub fn complete_session(
    conn: &Connection,
    id: &str,
    time_spent_min: i32,
    retrieval_score: f64,
    confidence: i32,
    energy_level: i32,
    notes: Option<&str>,
    completed_at: &str,
) -> Result<(), AppError> {
    conn.execute(
        "UPDATE sessions SET status = 'completed', time_spent_min = ?1, retrieval_score = ?2,
         confidence = ?3, energy_level = ?4, notes = ?5, completed_at = ?6
         WHERE id = ?7",
        params![time_spent_min, retrieval_score, confidence, energy_level, notes, completed_at, id],
    )?;
    Ok(())
}

// ── Session Phase CRUD ─────────────────────────────────────────────────

pub fn get_phases(conn: &Connection, session_id: &str) -> Result<Vec<SessionPhase>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, phase, duration_min, content, score, sort_order
         FROM session_phases WHERE session_id = ?1 ORDER BY sort_order"
    )?;
    let rows = stmt.query_map(params![session_id], |row| {
        let phase_str: String = row.get(2)?;
        let phase = match phase_str.as_str() {
            "learning" => PhaseType::Learning,
            "micro_task" => PhaseType::MicroTask,
            "reflection" => PhaseType::Reflection,
            _ => PhaseType::Retrieval,
        };
        Ok(SessionPhase {
            id: row.get(0)?,
            session_id: row.get(1)?,
            phase,
            duration_min: row.get(3)?,
            content: row.get(4)?,
            score: row.get(5)?,
            sort_order: row.get(6)?,
        })
    })?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

pub fn insert_phase(conn: &Connection, p: &SessionPhase) -> Result<(), AppError> {
    let phase_str = serde_json::to_string(&p.phase).unwrap_or_default();
    let phase_str = phase_str.trim_matches('"');
    conn.execute(
        "INSERT INTO session_phases (id, session_id, phase, duration_min, content, score, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![p.id, p.session_id, phase_str, p.duration_min, p.content, p.score, p.sort_order],
    )?;
    Ok(())
}

// ── Week CRUD ──────────────────────────────────────────────────────────

pub fn insert_week(conn: &Connection, w: &Week) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO weeks (id, week_num, start_date, end_date, objective, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![w.id, w.week_num, w.start_date, w.end_date, w.objective, w.status],
    )?;
    Ok(())
}

pub fn get_week(conn: &Connection, id: &str) -> Result<Week, AppError> {
    conn.query_row(
        "SELECT id, week_num, start_date, end_date, objective, status FROM weeks WHERE id = ?1",
        params![id],
        |row| Ok(Week {
            id: row.get(0)?,
            week_num: row.get(1)?,
            start_date: row.get(2)?,
            end_date: row.get(3)?,
            objective: row.get(4)?,
            status: row.get(5)?,
        }),
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Week {} not found", id)),
        e => AppError::Database(e.to_string()),
    })
}

pub fn get_sessions_by_week(conn: &Connection, week_id: &str) -> Result<Vec<Session>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, week_id, date, day_of_week, status, rescheduled_to,
         topics_json, tags_json, time_spent_min, retrieval_score, confidence, energy_level, notes, completed_at
         FROM sessions WHERE week_id = ?1 ORDER BY date"
    )?;
    let rows = stmt.query_map(params![week_id], |row| {
        let status_str: String = row.get(4)?;
        let status = match status_str.as_str() {
            "completed" => SessionStatus::Completed,
            "missed" => SessionStatus::Missed,
            "rescheduled" => SessionStatus::Rescheduled,
            _ => SessionStatus::Scheduled,
        };
        Ok(Session {
            id: row.get(0)?,
            week_id: row.get(1)?,
            date: row.get(2)?,
            day_of_week: row.get(3)?,
            status,
            rescheduled_to: row.get(5)?,
            topics_json: row.get(6)?,
            tags_json: row.get(7)?,
            time_spent_min: row.get(8)?,
            retrieval_score: row.get(9)?,
            confidence: row.get(10)?,
            energy_level: row.get(11)?,
            notes: row.get(12)?,
            completed_at: row.get(13)?,
        })
    })?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

pub fn get_weekly_aggregate(conn: &Connection, week_id: &str) -> Option<WeeklyAggregate> {
    conn.query_row(
        "SELECT week_id, total_hours, quiz_score, mastery_delta, trend_direction,
         variance_from_projection, attendance_rate, computed_at
         FROM weekly_aggregates WHERE week_id = ?1",
        params![week_id],
        |row| Ok(WeeklyAggregate {
            week_id: row.get(0)?,
            total_hours: row.get(1)?,
            quiz_score: row.get(2)?,
            mastery_delta: row.get(3)?,
            trend_direction: row.get(4)?,
            variance_from_projection: row.get(5)?,
            attendance_rate: row.get(6)?,
            computed_at: row.get(7)?,
        }),
    ).ok()
}

// ── Weekly Aggregate ───────────────────────────────────────────────────

pub fn upsert_weekly_aggregate(conn: &Connection, agg: &WeeklyAggregate) -> Result<(), AppError> {
    conn.execute(
        "INSERT OR REPLACE INTO weekly_aggregates
         (week_id, total_hours, quiz_score, mastery_delta, trend_direction, variance_from_projection, attendance_rate, computed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            agg.week_id, agg.total_hours, agg.quiz_score, agg.mastery_delta,
            agg.trend_direction, agg.variance_from_projection, agg.attendance_rate, agg.computed_at
        ],
    )?;
    Ok(())
}

// ── Quiz CRUD ──────────────────────────────────────────────────────────

pub fn insert_quiz(conn: &Connection, q: &Quiz) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO quizzes (id, week_id, date, status, total_score, difficulty_weighted_score, time_spent_min, completed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![q.id, q.week_id, q.date, q.status, q.total_score, q.difficulty_weighted_score, q.time_spent_min, q.completed_at],
    )?;
    Ok(())
}

pub fn insert_quiz_question(conn: &Connection, q: &QuizQuestion) -> Result<(), AppError> {
    let type_str = serde_json::to_string(&q.question_type).unwrap_or_default();
    let type_str = type_str.trim_matches('"');
    conn.execute(
        "INSERT INTO quiz_questions (id, quiz_id, topic_id, question_type, difficulty, question_text,
         options_json, correct_answer, user_answer, is_correct, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            q.id, q.quiz_id, q.topic_id, type_str, q.difficulty, q.question_text,
            q.options_json, q.correct_answer, q.user_answer, q.is_correct, q.sort_order
        ],
    )?;
    Ok(())
}

pub fn complete_quiz(conn: &Connection, quiz_id: &str, total_score: f64, weighted_score: f64, completed_at: &str) -> Result<(), AppError> {
    conn.execute(
        "UPDATE quizzes SET status = 'completed', total_score = ?1, difficulty_weighted_score = ?2, completed_at = ?3 WHERE id = ?4",
        params![total_score, weighted_score, completed_at, quiz_id],
    )?;
    Ok(())
}

// ── Intelligence State CRUD ────────────────────────────────────────────

pub fn get_all_spaced_rep(conn: &Connection) -> Result<Vec<(String, f64, Option<String>, Option<String>, u32)>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT topic_id, memory_strength, last_reviewed, next_review, review_count FROM spaced_rep"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, Option<String>>(2)?,
            row.get::<_, Option<String>>(3)?,
            row.get::<_, u32>(4)?,
        ))
    })?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

pub fn upsert_spaced_rep(
    conn: &Connection,
    topic_id: &str,
    memory_strength: f64,
    last_reviewed: Option<&str>,
    next_review: Option<&str>,
    review_count: u32,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT OR REPLACE INTO spaced_rep (topic_id, memory_strength, last_reviewed, next_review, review_count)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![topic_id, memory_strength, last_reviewed, next_review, review_count],
    )?;
    Ok(())
}

pub fn upsert_bayesian_state(
    conn: &Connection,
    topic_id: &str,
    alpha: f64,
    beta_param: f64,
    updated_at: &str,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT OR REPLACE INTO bayesian_state (topic_id, alpha, beta_param, updated_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![topic_id, alpha, beta_param, updated_at],
    )?;
    Ok(())
}

pub fn get_bayesian_state(conn: &Connection, topic_id: &str) -> Result<(f64, f64), AppError> {
    conn.query_row(
        "SELECT alpha, beta_param FROM bayesian_state WHERE topic_id = ?1",
        params![topic_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Bayesian state for {} not found", topic_id)),
        e => AppError::Database(e.to_string()),
    })
}

pub fn upsert_rl_state(
    conn: &Connection,
    current_week: u32,
    attendance_streak: u32,
    fatigue_proxy: f64,
    review_backlog_size: u32,
    quiz_trend: f64,
    updated_at: &str,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT OR REPLACE INTO rl_state (id, current_week, attendance_streak, fatigue_proxy, review_backlog_size, quiz_trend, updated_at)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6)",
        params![current_week, attendance_streak, fatigue_proxy, review_backlog_size, quiz_trend, updated_at],
    )?;
    Ok(())
}

// ── Behavioral State CRUD ─────────────────────────────────────────────

pub fn load_behavioral_state(conn: &Connection) -> Result<crate::engine::behavioral::BehavioralState, AppError> {
    conn.query_row(
        "SELECT attendance_streak, missed_streak, burnout_level, plateau_weeks, last_mastery_delta
         FROM behavioral_state WHERE id = 1",
        [],
        |row| {
            Ok(crate::engine::behavioral::BehavioralState {
                attendance_streak: row.get(0)?,
                missed_streak: row.get(1)?,
                burnout_level: row.get(2)?,
                plateau_weeks: row.get(3)?,
                last_mastery_delta: row.get(4)?,
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound("behavioral_state row not found".into()),
        e => AppError::Database(e.to_string()),
    })
}

pub fn upsert_behavioral_state(
    conn: &Connection,
    state: &crate::engine::behavioral::BehavioralState,
    updated_at: &str,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT OR REPLACE INTO behavioral_state
         (id, attendance_streak, missed_streak, burnout_level, plateau_weeks, last_mastery_delta, updated_at)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            state.attendance_streak,
            state.missed_streak,
            state.burnout_level,
            state.plateau_weeks,
            state.last_mastery_delta,
            updated_at
        ],
    )?;
    Ok(())
}

/// Mark all sessions with a date before `today` and status 'scheduled' as 'missed'.
/// Returns the count of sessions that were updated.
pub fn mark_past_sessions_missed(conn: &Connection, today: &str) -> Result<usize, AppError> {
    let count = conn.execute(
        "UPDATE sessions SET status = 'missed' WHERE date < ?1 AND status = 'scheduled'",
        params![today],
    )?;
    Ok(count)
}

// ── Behavioral Alert ──────────────────────────────────────────────────

pub fn insert_behavioral_alert(
    conn: &Connection,
    id: &str,
    date: &str,
    event_type: &str,
    severity: &str,
    details_json: Option<&str>,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO behavioral_log (id, date, event_type, severity, details_json, acknowledged)
         VALUES (?1, ?2, ?3, ?4, ?5, 0)",
        params![id, date, event_type, severity, details_json],
    )?;
    Ok(())
}

pub fn get_behavioral_alerts(
    conn: &Connection,
) -> Result<Vec<(String, String, String, String, String)>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, event_type, severity, details_json, date
         FROM behavioral_log
         WHERE acknowledged = 0
            OR date >= date('now', '-7 days')
         ORDER BY date DESC"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<String>>(3)?.unwrap_or_default(),
            row.get::<_, String>(4)?,
        ))
    })?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

// ── Topic queries ────────────────────────────────────────────────────

pub fn get_all_topics(conn: &Connection) -> Result<Vec<Topic>, AppError> {
    let domains = get_domains(conn)?;
    let mut all = Vec::new();
    for d in &domains {
        let topics = get_topics_by_domain(conn, &d.id)?;
        all.extend(topics);
    }
    Ok(all)
}

// ── Forecast CRUD ─────────────────────────────────────────────────────

pub fn insert_forecast(
    conn: &Connection,
    id: &str,
    computed_at: &str,
    sim_count: u32,
    attendance_p10: f64,
    attendance_p_median: f64,
    attendance_p90: f64,
    quiz_avg_p10: f64,
    quiz_avg_median: f64,
    quiz_avg_p90: f64,
    completion_confidence: f64,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO forecasts
         (id, computed_at, sim_count, attendance_p_median, attendance_p10, attendance_p90,
          quiz_avg_median, quiz_avg_p10, quiz_avg_p90, completion_confidence, distribution_json)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, NULL)",
        params![
            id, computed_at, sim_count,
            attendance_p_median, attendance_p10, attendance_p90,
            quiz_avg_median, quiz_avg_p10, quiz_avg_p90,
            completion_confidence
        ],
    )?;
    Ok(())
}

/// Compute the average Bayesian mastery (alpha / (alpha + beta)) across all topics.
pub fn get_avg_mastery(conn: &Connection) -> Result<f64, AppError> {
    conn.query_row(
        "SELECT AVG(alpha / (alpha + beta_param)) FROM bayesian_state",
        [],
        |row| row.get::<_, Option<f64>>(0),
    )
    .map(|v| v.unwrap_or(0.0))
    .map_err(|e| AppError::Database(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema::run_migrations;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn test_user_crud_roundtrip() {
        let conn = setup();
        let user = User {
            id: "u1".into(),
            name: "Leon".into(),
            email: Some("leon@test.com".into()),
            avatar_seed: None,
            theme: Theme::Glass,
            created_at: "2026-03-01".into(),
            updated_at: "2026-03-01".into(),
        };
        create_user(&conn, &user).unwrap();
        let fetched = get_user(&conn, "u1").unwrap();
        assert_eq!(fetched.name, "Leon");
        assert_eq!(fetched.theme.as_str(), "glass");
    }

    #[test]
    fn test_user_theme_update() {
        let conn = setup();
        let user = User {
            id: "u1".into(), name: "Leon".into(), email: None, avatar_seed: None,
            theme: Theme::Glass, created_at: "2026-03-01".into(), updated_at: "2026-03-01".into(),
        };
        create_user(&conn, &user).unwrap();
        update_user_theme(&conn, "u1", &Theme::Console).unwrap();
        let fetched = get_user(&conn, "u1").unwrap();
        assert_eq!(fetched.theme.as_str(), "console");
    }

    #[test]
    fn test_domain_seeding() {
        let conn = setup();
        let domains = crate::models::topic::default_domains();
        seed_domains(&conn, &domains).unwrap();
        let fetched = get_domains(&conn).unwrap();
        assert_eq!(fetched.len(), 8);
        // Seeding again should not duplicate
        seed_domains(&conn, &domains).unwrap();
        let fetched2 = get_domains(&conn).unwrap();
        assert_eq!(fetched2.len(), 8);
    }

    #[test]
    fn test_session_insert_and_complete() {
        let conn = setup();
        // Insert a week first (FK)
        let week = Week {
            id: "W01".into(), week_num: 1, start_date: "2026-03-02".into(),
            end_date: "2026-03-06".into(), objective: None, status: "upcoming".into(),
        };
        insert_week(&conn, &week).unwrap();

        let session = Session {
            id: "S001".into(), week_id: "W01".into(), date: "2026-03-02".into(),
            day_of_week: 1, status: SessionStatus::Scheduled, rescheduled_to: None,
            topics_json: None, tags_json: None, time_spent_min: None,
            retrieval_score: None, confidence: None, energy_level: None,
            notes: None, completed_at: None,
        };
        insert_session(&conn, &session).unwrap();

        complete_session(&conn, "S001", 45, 0.85, 4, 3, Some("Good session"), "2026-03-02T18:00:00").unwrap();
        let fetched = get_session(&conn, "S001").unwrap();
        assert_eq!(fetched.status, SessionStatus::Completed);
        assert_eq!(fetched.time_spent_min, Some(45));
        assert!((fetched.retrieval_score.unwrap() - 0.85).abs() < 1e-10);
    }

    #[test]
    fn test_quiz_lifecycle() {
        let conn = setup();
        let week = Week {
            id: "W01".into(), week_num: 1, start_date: "2026-03-02".into(),
            end_date: "2026-03-06".into(), objective: None, status: "upcoming".into(),
        };
        insert_week(&conn, &week).unwrap();

        let quiz = Quiz {
            id: "Q01".into(), week_id: "W01".into(), date: "2026-03-06".into(),
            status: "pending".into(), total_score: None, difficulty_weighted_score: None,
            time_spent_min: None, completed_at: None, questions: vec![],
        };
        insert_quiz(&conn, &quiz).unwrap();
        complete_quiz(&conn, "Q01", 80.0, 72.5, "2026-03-06T17:00:00").unwrap();

        let row: (String, f64) = conn.query_row(
            "SELECT status, total_score FROM quizzes WHERE id = 'Q01'",
            [], |row| Ok((row.get(0)?, row.get(1)?)),
        ).unwrap();
        assert_eq!(row.0, "completed");
        assert!((row.1 - 80.0).abs() < 1e-10);
    }

    #[test]
    fn test_intelligence_state_roundtrip() {
        let conn = setup();
        // Spaced rep needs a domain + topic (FK)
        conn.execute(
            "INSERT INTO domains (id, name, slug, color, sort_order, is_custom) VALUES ('d1', 'DS', 'ds', '#000', 0, 0)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO topics (id, domain_id, name, slug, depth, created_at) VALUES ('t1', 'd1', 'Python', 'python', 0, '2026-03-01')",
            [],
        ).unwrap();

        upsert_spaced_rep(&conn, "t1", 2.5, Some("2026-03-01"), Some("2026-03-03"), 5).unwrap();
        upsert_bayesian_state(&conn, "t1", 3.0, 2.0, "2026-03-01").unwrap();

        let (alpha, beta) = get_bayesian_state(&conn, "t1").unwrap();
        assert!((alpha - 3.0).abs() < 1e-10);
        assert!((beta - 2.0).abs() < 1e-10);

        // Update should overwrite
        upsert_bayesian_state(&conn, "t1", 4.0, 2.5, "2026-03-02").unwrap();
        let (alpha2, _) = get_bayesian_state(&conn, "t1").unwrap();
        assert!((alpha2 - 4.0).abs() < 1e-10);
    }

    #[test]
    fn test_rl_state_upsert() {
        let conn = setup();
        upsert_rl_state(&conn, 5, 10, 0.3, 5, 0.02, "2026-03-01").unwrap();
        // Update
        upsert_rl_state(&conn, 6, 11, 0.4, 3, -0.01, "2026-03-08").unwrap();
        let week: u32 = conn.query_row(
            "SELECT current_week FROM rl_state WHERE id = 1", [], |row| row.get(0),
        ).unwrap();
        assert_eq!(week, 6);
    }
}
