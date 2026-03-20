use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use crate::error::AppError;
use crate::models::user::{User, Theme};
use crate::db::queries;

pub struct DbState(pub Mutex<Connection>);

#[tauri::command]
pub fn create_user(db: State<'_, DbState>, name: String, theme: String) -> Result<User, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let parsed_theme = theme.parse::<Theme>().unwrap_or_default();
    let user = User {
        id: id.clone(),
        name,
        email: None,
        avatar_seed: None,
        theme: parsed_theme,
        created_at: now.clone(),
        updated_at: now,
    };
    queries::create_user(&conn, &user)?;
    Ok(user)
}

#[tauri::command]
pub fn get_user(db: State<'_, DbState>, id: String) -> Result<User, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    queries::get_user(&conn, &id)
}

#[tauri::command]
pub fn set_theme(db: State<'_, DbState>, user_id: String, theme: String) -> Result<(), AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let parsed = theme.parse::<Theme>().map_err(|e| AppError::Validation(e))?;
    queries::update_user_theme(&conn, &user_id, &parsed)
}

#[tauri::command]
pub fn list_users(db: State<'_, DbState>) -> Result<Vec<User>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    queries::list_users(&conn)
}
