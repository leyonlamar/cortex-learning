use tauri::State;
use crate::commands::user::DbState;
use crate::error::AppError;
use crate::db::sync;
use std::fmt::Write as FmtWrite;
use std::fs;

#[tauri::command]
pub fn export_json(db: State<'_, DbState>) -> Result<String, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let snapshot = sync::export_to_json(&conn)?;
    let json = serde_json::to_string_pretty(&snapshot)?;
    Ok(json)
}

#[tauri::command]
pub fn import_json(db: State<'_, DbState>, json: String) -> Result<(), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let snapshot: sync::DataSnapshot = serde_json::from_str(&json)?;
    sync::import_from_json(&conn, &snapshot)
}

#[tauri::command]
pub fn export_to_file(db: State<'_, DbState>, path: String) -> Result<(), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    sync::export_to_file(&conn, std::path::Path::new(&path))
}

#[tauri::command]
pub fn import_from_file(db: State<'_, DbState>, path: String) -> Result<(), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    sync::import_from_file(&conn, std::path::Path::new(&path))
}

/// Helper: escape a value for CSV (wrap in quotes if it contains comma, quote, or newline).
fn csv_escape(value: &str) -> String {
    if value.contains(',') || value.contains('"') || value.contains('\n') {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_string()
    }
}

/// Helper: format an Option<f64> for CSV output.
fn opt_f64(v: Option<f64>) -> String {
    v.map(|x| format!("{:.4}", x)).unwrap_or_default()
}

/// Helper: format an Option<i64> for CSV output.
fn opt_i64(v: Option<i64>) -> String {
    v.map(|x| x.to_string()).unwrap_or_default()
}

/// Helper: format an Option<String> for CSV output.
fn opt_str(v: Option<String>) -> String {
    v.map(|s| csv_escape(&s)).unwrap_or_default()
}

/// Resolve `~desktop/<rest>` to the user's Desktop directory.
fn resolve_path(path: &str) -> std::path::PathBuf {
    if let Some(rest) = path.strip_prefix("~desktop/").or_else(|| path.strip_prefix("~desktop\\")) {
        let home = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_else(|_| ".".to_string());
        std::path::PathBuf::from(home).join("Desktop").join(rest)
    } else {
        std::path::PathBuf::from(path)
    }
}

/// Export CSVs to `path` (directory). Returns the resolved directory path.
#[tauri::command]
pub fn export_csv_to_file(db: State<'_, DbState>, path: String) -> Result<String, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let dir = resolve_path(&path);
    let dir = dir.as_path();
    fs::create_dir_all(dir)?;

    // ── sessions.csv ─────────────────────────────────────────────────────
    {
        let mut out = String::new();
        writeln!(out, "date,status,time_spent_min,retrieval_score,confidence,energy_level")
            .map_err(|e| AppError::Io(e.to_string()))?;
        let mut stmt = conn.prepare(
            "SELECT date, status, time_spent_min, retrieval_score, confidence, energy_level FROM sessions ORDER BY date"
        ).map_err(|e| AppError::Database(e.to_string()))?;
        let mut rows = stmt.query([]).map_err(|e| AppError::Database(e.to_string()))?;
        while let Some(row) = rows.next().map_err(|e| AppError::Database(e.to_string()))? {
            let date: String = row.get(0).map_err(|e| AppError::Database(e.to_string()))?;
            let status: String = row.get(1).map_err(|e| AppError::Database(e.to_string()))?;
            let time_spent: Option<i64> = row.get(2).map_err(|e| AppError::Database(e.to_string()))?;
            let retrieval: Option<f64> = row.get(3).map_err(|e| AppError::Database(e.to_string()))?;
            let confidence: Option<i64> = row.get(4).map_err(|e| AppError::Database(e.to_string()))?;
            let energy: Option<i64> = row.get(5).map_err(|e| AppError::Database(e.to_string()))?;
            writeln!(out, "{},{},{},{},{},{}",
                csv_escape(&date), csv_escape(&status),
                opt_i64(time_spent), opt_f64(retrieval),
                opt_i64(confidence), opt_i64(energy),
            ).map_err(|e| AppError::Io(e.to_string()))?;
        }
        fs::write(dir.join("sessions.csv"), out)?;
    }

    // ── quizzes.csv ──────────────────────────────────────────────────────
    {
        let mut out = String::new();
        writeln!(out, "date,status,total_score,weighted_score,time_spent_min")
            .map_err(|e| AppError::Io(e.to_string()))?;
        let mut stmt = conn.prepare(
            "SELECT date, status, total_score, difficulty_weighted_score, time_spent_min FROM quizzes ORDER BY date"
        ).map_err(|e| AppError::Database(e.to_string()))?;
        let mut rows = stmt.query([]).map_err(|e| AppError::Database(e.to_string()))?;
        while let Some(row) = rows.next().map_err(|e| AppError::Database(e.to_string()))? {
            let date: String = row.get(0).map_err(|e| AppError::Database(e.to_string()))?;
            let status: String = row.get(1).map_err(|e| AppError::Database(e.to_string()))?;
            let total: Option<f64> = row.get(2).map_err(|e| AppError::Database(e.to_string()))?;
            let weighted: Option<f64> = row.get(3).map_err(|e| AppError::Database(e.to_string()))?;
            let time_spent: Option<i64> = row.get(4).map_err(|e| AppError::Database(e.to_string()))?;
            writeln!(out, "{},{},{},{},{}",
                csv_escape(&date), csv_escape(&status),
                opt_f64(total), opt_f64(weighted), opt_i64(time_spent),
            ).map_err(|e| AppError::Io(e.to_string()))?;
        }
        fs::write(dir.join("quizzes.csv"), out)?;
    }

    // ── weekly_summary.csv ───────────────────────────────────────────────
    {
        let mut out = String::new();
        writeln!(out, "week_number,total_hours,quiz_score,attendance_rate,mastery_delta,trend_direction")
            .map_err(|e| AppError::Io(e.to_string()))?;
        let mut stmt = conn.prepare(
            "SELECT w.week_num, wa.total_hours, wa.quiz_score, wa.attendance_rate,
                    wa.mastery_delta, wa.trend_direction
             FROM weekly_aggregates wa
             JOIN weeks w ON w.id = wa.week_id
             ORDER BY w.week_num"
        ).map_err(|e| AppError::Database(e.to_string()))?;
        let mut rows = stmt.query([]).map_err(|e| AppError::Database(e.to_string()))?;
        while let Some(row) = rows.next().map_err(|e| AppError::Database(e.to_string()))? {
            let week_num: i64 = row.get(0).map_err(|e| AppError::Database(e.to_string()))?;
            let total_hours: Option<f64> = row.get(1).map_err(|e| AppError::Database(e.to_string()))?;
            let quiz_score: Option<f64> = row.get(2).map_err(|e| AppError::Database(e.to_string()))?;
            let attendance: Option<f64> = row.get(3).map_err(|e| AppError::Database(e.to_string()))?;
            let mastery_delta: Option<f64> = row.get(4).map_err(|e| AppError::Database(e.to_string()))?;
            let trend: Option<String> = row.get(5).map_err(|e| AppError::Database(e.to_string()))?;
            writeln!(out, "{},{},{},{},{},{}",
                week_num, opt_f64(total_hours), opt_f64(quiz_score),
                opt_f64(attendance), opt_f64(mastery_delta), opt_str(trend),
            ).map_err(|e| AppError::Io(e.to_string()))?;
        }
        fs::write(dir.join("weekly_summary.csv"), out)?;
    }

    // ── mastery.csv ──────────────────────────────────────────────────────
    {
        let mut out = String::new();
        writeln!(out, "topic_name,domain_name,mastery_mean,uncertainty,last_updated")
            .map_err(|e| AppError::Io(e.to_string()))?;
        let mut stmt = conn.prepare(
            "SELECT t.name, d.name,
                    bs.alpha / (bs.alpha + bs.beta_param),
                    1.0 / (bs.alpha + bs.beta_param + 1.0),
                    bs.updated_at
             FROM bayesian_state bs
             JOIN topics t ON t.id = bs.topic_id
             JOIN domains d ON d.id = t.domain_id
             ORDER BY d.name, t.name"
        ).map_err(|e| AppError::Database(e.to_string()))?;
        let mut rows = stmt.query([]).map_err(|e| AppError::Database(e.to_string()))?;
        while let Some(row) = rows.next().map_err(|e| AppError::Database(e.to_string()))? {
            let topic: String = row.get(0).map_err(|e| AppError::Database(e.to_string()))?;
            let domain: String = row.get(1).map_err(|e| AppError::Database(e.to_string()))?;
            let mastery: f64 = row.get(2).map_err(|e| AppError::Database(e.to_string()))?;
            let uncertainty: f64 = row.get(3).map_err(|e| AppError::Database(e.to_string()))?;
            let updated: String = row.get(4).map_err(|e| AppError::Database(e.to_string()))?;
            writeln!(out, "{},{},{:.4},{:.4},{}",
                csv_escape(&topic), csv_escape(&domain),
                mastery, uncertainty, csv_escape(&updated),
            ).map_err(|e| AppError::Io(e.to_string()))?;
        }
        fs::write(dir.join("mastery.csv"), out)?;
    }

    // ── spaced_rep.csv ───────────────────────────────────────────────────
    {
        let mut out = String::new();
        writeln!(out, "topic_name,memory_strength,recall_probability,next_review,review_count")
            .map_err(|e| AppError::Io(e.to_string()))?;
        let mut stmt = conn.prepare(
            "SELECT t.name, sr.memory_strength,
                    exp(-1.0 / sr.memory_strength),
                    sr.next_review, sr.review_count
             FROM spaced_rep sr
             JOIN topics t ON t.id = sr.topic_id
             ORDER BY sr.next_review ASC"
        ).map_err(|e| AppError::Database(e.to_string()))?;
        let mut rows = stmt.query([]).map_err(|e| AppError::Database(e.to_string()))?;
        while let Some(row) = rows.next().map_err(|e| AppError::Database(e.to_string()))? {
            let topic: String = row.get(0).map_err(|e| AppError::Database(e.to_string()))?;
            let strength: f64 = row.get(1).map_err(|e| AppError::Database(e.to_string()))?;
            let recall: f64 = row.get(2).map_err(|e| AppError::Database(e.to_string()))?;
            let next_review: Option<String> = row.get(3).map_err(|e| AppError::Database(e.to_string()))?;
            let review_count: i64 = row.get(4).map_err(|e| AppError::Database(e.to_string()))?;
            writeln!(out, "{},{:.4},{:.4},{},{}",
                csv_escape(&topic), strength, recall,
                opt_str(next_review), review_count,
            ).map_err(|e| AppError::Io(e.to_string()))?;
        }
        fs::write(dir.join("spaced_rep.csv"), out)?;
    }

    let resolved = fs::canonicalize(dir)
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| path.clone());
    Ok(resolved)
}
