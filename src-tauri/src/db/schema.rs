use rusqlite::Connection;
use crate::error::AppError;

/// Run all migrations on the given connection.
/// Migrations are idempotent — safe to call on every app startup.
pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(SCHEMA_SQL)?;
    Ok(())
}

const SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS user_profile (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT,
    avatar_seed TEXT,
    theme       TEXT NOT NULL DEFAULT 'glass',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domains (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    color       TEXT NOT NULL,
    icon        TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_custom   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
    id          TEXT PRIMARY KEY,
    domain_id   TEXT NOT NULL REFERENCES domains(id),
    parent_id   TEXT REFERENCES topics(id),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    depth       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    UNIQUE(domain_id, slug)
);

CREATE TABLE IF NOT EXISTS weeks (
    id          TEXT PRIMARY KEY,
    week_num    INTEGER NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    objective   TEXT,
    status      TEXT NOT NULL DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    week_id         TEXT NOT NULL REFERENCES weeks(id),
    date            TEXT NOT NULL UNIQUE,
    day_of_week     INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'scheduled',
    rescheduled_to  TEXT,
    topics_json     TEXT,
    tags_json       TEXT,
    time_spent_min  INTEGER,
    retrieval_score REAL,
    confidence      INTEGER,
    energy_level    INTEGER,
    notes           TEXT,
    completed_at    TEXT
);

CREATE TABLE IF NOT EXISTS session_phases (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id),
    phase       TEXT NOT NULL,
    duration_min INTEGER,
    content     TEXT,
    score       REAL,
    sort_order  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
    id              TEXT PRIMARY KEY,
    week_id         TEXT NOT NULL REFERENCES weeks(id) UNIQUE,
    date            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    total_score     REAL,
    difficulty_weighted_score REAL,
    time_spent_min  INTEGER,
    completed_at    TEXT
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id              TEXT PRIMARY KEY,
    quiz_id         TEXT NOT NULL REFERENCES quizzes(id),
    topic_id        TEXT REFERENCES topics(id),
    question_type   TEXT NOT NULL,
    difficulty      REAL NOT NULL DEFAULT 0.5,
    question_text   TEXT NOT NULL,
    options_json    TEXT,
    correct_answer  TEXT NOT NULL,
    user_answer     TEXT,
    is_correct      INTEGER,
    sort_order      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS spaced_rep (
    topic_id            TEXT PRIMARY KEY REFERENCES topics(id),
    memory_strength     REAL NOT NULL DEFAULT 1.0,
    last_reviewed       TEXT,
    next_review         TEXT,
    review_count        INTEGER NOT NULL DEFAULT 0,
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    consecutive_wrong   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bayesian_state (
    topic_id    TEXT PRIMARY KEY REFERENCES topics(id),
    alpha       REAL NOT NULL DEFAULT 1.0,
    beta_param  REAL NOT NULL DEFAULT 1.0,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS forecasts (
    id                    TEXT PRIMARY KEY,
    computed_at           TEXT NOT NULL,
    sim_count             INTEGER NOT NULL,
    attendance_p_median   REAL,
    attendance_p10        REAL,
    attendance_p90        REAL,
    quiz_avg_median       REAL,
    quiz_avg_p10          REAL,
    quiz_avg_p90          REAL,
    completion_confidence REAL,
    distribution_json     TEXT
);

CREATE TABLE IF NOT EXISTS behavioral_log (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    event_type  TEXT NOT NULL,
    severity    TEXT NOT NULL,
    details_json TEXT,
    acknowledged INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS behavioral_state (
    id               INTEGER PRIMARY KEY CHECK (id = 1),
    attendance_streak INTEGER NOT NULL DEFAULT 0,
    missed_streak    INTEGER NOT NULL DEFAULT 0,
    burnout_level    REAL NOT NULL DEFAULT 0.0,
    plateau_weeks    INTEGER NOT NULL DEFAULT 0,
    last_mastery_delta REAL NOT NULL DEFAULT 0.0,
    updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rl_state (
    id                  INTEGER PRIMARY KEY CHECK (id = 1),
    current_week        INTEGER NOT NULL,
    attendance_streak   INTEGER NOT NULL DEFAULT 0,
    fatigue_proxy       REAL NOT NULL DEFAULT 0.0,
    review_backlog_size INTEGER NOT NULL DEFAULT 0,
    quiz_trend          REAL NOT NULL DEFAULT 0.0,
    last_action_json    TEXT,
    reward_history_json TEXT,
    updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_aggregates (
    week_id                  TEXT PRIMARY KEY REFERENCES weeks(id),
    total_hours              REAL,
    quiz_score               REAL,
    mastery_delta            REAL,
    trend_direction          TEXT,
    variance_from_projection REAL,
    attendance_rate          REAL,
    computed_at              TEXT NOT NULL
);
"#;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_migrations_create_all_tables() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();

        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        let expected = vec![
            "bayesian_state",
            "behavioral_log",
            "behavioral_state",
            "domains",
            "forecasts",
            "quiz_questions",
            "quizzes",
            "rl_state",
            "session_phases",
            "sessions",
            "spaced_rep",
            "topics",
            "user_profile",
            "weekly_aggregates",
            "weeks",
        ];

        for table in &expected {
            assert!(
                tables.contains(&table.to_string()),
                "Missing table: {}",
                table
            );
        }
    }

    #[test]
    fn test_migrations_are_idempotent() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        run_migrations(&conn).unwrap();
    }

    #[test]
    fn test_foreign_keys_enforced() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&conn).unwrap();

        let result = conn.execute(
            "INSERT INTO sessions (id, week_id, date, day_of_week, status) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params!["s1", "NONEXISTENT", "2026-03-02", 1, "scheduled"],
        );
        assert!(result.is_err(), "Foreign key constraint should reject invalid week_id");
    }
}
