use std::path::Path;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use crate::error::AppError;

/// Portable data snapshot for export/import.
#[derive(Debug, Serialize, Deserialize)]
pub struct DataSnapshot {
    pub version: u32,
    pub exported_at: String,
    pub user_profile: Vec<serde_json::Value>,
    pub domains: Vec<serde_json::Value>,
    pub topics: Vec<serde_json::Value>,
    pub weeks: Vec<serde_json::Value>,
    pub sessions: Vec<serde_json::Value>,
    pub session_phases: Vec<serde_json::Value>,
    pub quizzes: Vec<serde_json::Value>,
    pub quiz_questions: Vec<serde_json::Value>,
    pub spaced_rep: Vec<serde_json::Value>,
    pub bayesian_state: Vec<serde_json::Value>,
    pub weekly_aggregates: Vec<serde_json::Value>,
}

/// Export all data from the database to a JSON snapshot.
pub fn export_to_json(conn: &Connection) -> Result<DataSnapshot, AppError> {
    Ok(DataSnapshot {
        version: 1,
        exported_at: chrono::Utc::now().to_rfc3339(),
        user_profile: export_table(conn, "user_profile")?,
        domains: export_table(conn, "domains")?,
        topics: export_table(conn, "topics")?,
        weeks: export_table(conn, "weeks")?,
        sessions: export_table(conn, "sessions")?,
        session_phases: export_table(conn, "session_phases")?,
        quizzes: export_table(conn, "quizzes")?,
        quiz_questions: export_table(conn, "quiz_questions")?,
        spaced_rep: export_table(conn, "spaced_rep")?,
        bayesian_state: export_table(conn, "bayesian_state")?,
        weekly_aggregates: export_table(conn, "weekly_aggregates")?,
    })
}

fn export_table(conn: &Connection, table: &str) -> Result<Vec<serde_json::Value>, AppError> {
    let sql = format!("SELECT * FROM {}", table);
    let mut stmt = conn.prepare(&sql)?;
    let col_count = stmt.column_count();
    let col_names: Vec<String> = (0..col_count).map(|i| stmt.column_name(i).unwrap().to_string()).collect();

    let mut rows = Vec::new();
    let mut result_rows = stmt.query([])?;
    while let Some(row) = result_rows.next()? {
        let mut obj = serde_json::Map::new();
        for (i, name) in col_names.iter().enumerate() {
            let val: rusqlite::types::Value = row.get_unwrap(i);
            let json_val = match val {
                rusqlite::types::Value::Null => serde_json::Value::Null,
                rusqlite::types::Value::Integer(n) => serde_json::Value::Number(n.into()),
                rusqlite::types::Value::Real(f) => serde_json::json!(f),
                rusqlite::types::Value::Text(s) => serde_json::Value::String(s),
                rusqlite::types::Value::Blob(b) => serde_json::Value::String(base64_encode(&b)),
            };
            obj.insert(name.clone(), json_val);
        }
        rows.push(serde_json::Value::Object(obj));
    }
    Ok(rows)
}

fn base64_encode(data: &[u8]) -> String {
    // Simple hex encoding for blob data
    data.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Import data from a JSON snapshot into the database.
/// Clears existing data and replaces with snapshot content.
pub fn import_from_json(conn: &Connection, snapshot: &DataSnapshot) -> Result<(), AppError> {
    // Clear all tables in reverse dependency order
    conn.execute_batch(
        "DELETE FROM weekly_aggregates;
         DELETE FROM bayesian_state;
         DELETE FROM spaced_rep;
         DELETE FROM quiz_questions;
         DELETE FROM quizzes;
         DELETE FROM session_phases;
         DELETE FROM sessions;
         DELETE FROM topics;
         DELETE FROM weeks;
         DELETE FROM domains;
         DELETE FROM user_profile;"
    )?;

    import_table(conn, "user_profile", &snapshot.user_profile)?;
    import_table(conn, "domains", &snapshot.domains)?;
    import_table(conn, "topics", &snapshot.topics)?;
    import_table(conn, "weeks", &snapshot.weeks)?;
    import_table(conn, "sessions", &snapshot.sessions)?;
    import_table(conn, "session_phases", &snapshot.session_phases)?;
    import_table(conn, "quizzes", &snapshot.quizzes)?;
    import_table(conn, "quiz_questions", &snapshot.quiz_questions)?;
    import_table(conn, "spaced_rep", &snapshot.spaced_rep)?;
    import_table(conn, "bayesian_state", &snapshot.bayesian_state)?;
    import_table(conn, "weekly_aggregates", &snapshot.weekly_aggregates)?;

    Ok(())
}

fn import_table(conn: &Connection, table: &str, rows: &[serde_json::Value]) -> Result<(), AppError> {
    for row in rows {
        if let serde_json::Value::Object(obj) = row {
            if obj.is_empty() {
                continue;
            }
            let cols: Vec<&str> = obj.keys().map(|k| k.as_str()).collect();
            let placeholders: Vec<String> = (1..=cols.len()).map(|i| format!("?{}", i)).collect();
            let sql = format!(
                "INSERT OR REPLACE INTO {} ({}) VALUES ({})",
                table,
                cols.join(", "),
                placeholders.join(", ")
            );
            let mut stmt = conn.prepare(&sql)?;
            let values: Vec<Box<dyn rusqlite::types::ToSql>> = cols.iter().map(|&col| {
                let val = &obj[col];
                let boxed: Box<dyn rusqlite::types::ToSql> = match val {
                    serde_json::Value::Null => Box::new(rusqlite::types::Null),
                    serde_json::Value::Bool(b) => Box::new(*b as i32),
                    serde_json::Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            Box::new(i)
                        } else if let Some(f) = n.as_f64() {
                            Box::new(f)
                        } else {
                            Box::new(rusqlite::types::Null)
                        }
                    }
                    serde_json::Value::String(s) => Box::new(s.clone()),
                    _ => Box::new(val.to_string()),
                };
                boxed
            }).collect();
            let refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| &**v as &dyn rusqlite::types::ToSql).collect();
            stmt.execute(refs.as_slice())?;
        }
    }
    Ok(())
}

/// Write snapshot to a file on disk.
pub fn export_to_file(conn: &Connection, path: &Path) -> Result<(), AppError> {
    let snapshot = export_to_json(conn)?;
    let json = serde_json::to_string_pretty(&snapshot)?;
    std::fs::write(path, json)?;
    Ok(())
}

/// Read snapshot from a file on disk and import it.
pub fn import_from_file(conn: &Connection, path: &Path) -> Result<(), AppError> {
    let json = std::fs::read_to_string(path)?;
    let snapshot: DataSnapshot = serde_json::from_str(&json)?;
    import_from_json(conn, &snapshot)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::schema::run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn test_export_empty_database() {
        let conn = setup();
        let snapshot = export_to_json(&conn).unwrap();
        assert_eq!(snapshot.version, 1);
        assert!(snapshot.user_profile.is_empty());
        assert!(snapshot.domains.is_empty());
    }

    #[test]
    fn test_export_import_roundtrip() {
        let conn = setup();

        // Insert some data
        conn.execute(
            "INSERT INTO user_profile (id, name, theme, created_at, updated_at) VALUES ('u1', 'Leon', 'glass', '2026-03-01', '2026-03-01')",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO domains (id, name, slug, color, sort_order, is_custom) VALUES ('d1', 'Data Science', 'ds', '#6366f1', 0, 0)",
            [],
        ).unwrap();

        let snapshot = export_to_json(&conn).unwrap();
        assert_eq!(snapshot.user_profile.len(), 1);
        assert_eq!(snapshot.domains.len(), 1);

        // Import into a fresh database
        let conn2 = setup();
        import_from_json(&conn2, &snapshot).unwrap();

        // Verify data survived
        let name: String = conn2.query_row(
            "SELECT name FROM user_profile WHERE id = 'u1'", [], |row| row.get(0),
        ).unwrap();
        assert_eq!(name, "Leon");

        let domain_name: String = conn2.query_row(
            "SELECT name FROM domains WHERE id = 'd1'", [], |row| row.get(0),
        ).unwrap();
        assert_eq!(domain_name, "Data Science");
    }

    #[test]
    fn test_import_replaces_existing_data() {
        let conn = setup();
        conn.execute(
            "INSERT INTO user_profile (id, name, theme, created_at, updated_at) VALUES ('u1', 'Old', 'glass', '2026-01-01', '2026-01-01')",
            [],
        ).unwrap();

        let snapshot = DataSnapshot {
            version: 1,
            exported_at: "2026-03-01".into(),
            user_profile: vec![serde_json::json!({
                "id": "u2", "name": "New", "theme": "executive", "created_at": "2026-03-01", "updated_at": "2026-03-01"
            })],
            domains: vec![],
            topics: vec![],
            weeks: vec![],
            sessions: vec![],
            session_phases: vec![],
            quizzes: vec![],
            quiz_questions: vec![],
            spaced_rep: vec![],
            bayesian_state: vec![],
            weekly_aggregates: vec![],
        };

        import_from_json(&conn, &snapshot).unwrap();

        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM user_profile", [], |row| row.get(0),
        ).unwrap();
        assert_eq!(count, 1, "Import should replace, not append");

        let name: String = conn.query_row(
            "SELECT name FROM user_profile WHERE id = 'u2'", [], |row| row.get(0),
        ).unwrap();
        assert_eq!(name, "New");
    }
}
