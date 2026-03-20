use tauri::State;
use crate::commands::user::DbState;
use crate::error::AppError;
use crate::models::topic::{Domain, Topic};
use crate::db::queries;

#[tauri::command]
pub fn get_domains(db: State<'_, DbState>) -> Result<Vec<Domain>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    queries::get_domains(&conn)
}

#[tauri::command]
pub fn get_topics(db: State<'_, DbState>, domain_id: String) -> Result<Vec<Topic>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    queries::get_topics_by_domain(&conn, &domain_id)
}

#[tauri::command]
pub fn get_all_topics(db: State<'_, DbState>) -> Result<Vec<Topic>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let domains = queries::get_domains(&conn)?;
    let mut all = Vec::new();
    for d in &domains {
        let topics = queries::get_topics_by_domain(&conn, &d.id)?;
        all.extend(topics);
    }
    Ok(all)
}
