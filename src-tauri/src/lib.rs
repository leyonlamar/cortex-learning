mod commands;
pub mod data;
mod db;
mod engine;
mod error;
mod models;

use commands::user::DbState;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            let db_path = app_dir.join("learning-os.db");

            let conn = Connection::open(&db_path).expect("failed to open database");
            conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
                .expect("failed to set pragmas");
            db::schema::run_migrations(&conn).expect("failed to run migrations");

            // Seed default domains on first launch
            let count: i32 = conn
                .query_row("SELECT COUNT(*) FROM domains", [], |row| row.get(0))
                .unwrap_or(0);
            if count == 0 {
                let domains = models::topic::default_domains();
                db::queries::seed_domains(&conn, &domains).expect("failed to seed domains");
            }

            // Seed default topics on first launch
            let topic_count: i32 = conn
                .query_row("SELECT COUNT(*) FROM topics", [], |row| row.get(0))
                .unwrap_or(0);
            if topic_count == 0 {
                db::queries::seed_default_topics(&conn).expect("failed to seed topics");
            }

            // Seed rl_state singleton on first launch
            let rl_count: i32 = conn
                .query_row("SELECT COUNT(*) FROM rl_state WHERE id = 1", [], |row| row.get(0))
                .unwrap_or(0);
            if rl_count == 0 {
                let now = chrono::Utc::now().to_rfc3339();
                db::queries::upsert_rl_state(&conn, 1, 0, 0.0, 0, 0.0, &now)
                    .expect("failed to seed rl_state");
            }

            // Seed behavioral_state singleton on first launch
            let beh_count: i32 = conn
                .query_row("SELECT COUNT(*) FROM behavioral_state WHERE id = 1", [], |row| row.get(0))
                .unwrap_or(0);
            if beh_count == 0 {
                let now = chrono::Utc::now().to_rfc3339();
                let default_beh = engine::behavioral::BehavioralState::new();
                db::queries::upsert_behavioral_state(&conn, &default_beh, &now)
                    .expect("failed to seed behavioral_state");
            }

            // Mark past scheduled sessions as missed on every launch
            let today = chrono::Local::now().format("%Y-%m-%d").to_string();
            let missed_count = db::queries::mark_past_sessions_missed(&conn, &today)
                .unwrap_or(0);
            if missed_count > 0 {
                if let Ok(mut beh_state) = db::queries::load_behavioral_state(&conn) {
                    for _ in 0..missed_count {
                        engine::behavioral::record_attendance(&mut beh_state, false);
                    }
                    let now = chrono::Utc::now().to_rfc3339();
                    db::queries::upsert_behavioral_state(&conn, &beh_state, &now)
                        .expect("failed to persist behavioral state after marking missed sessions");
                }
            }

            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // User
            commands::user::create_user,
            commands::user::get_user,
            commands::user::list_users,
            commands::user::set_theme,
            // Calendar
            commands::calendar::init_calendar,
            commands::calendar::get_week,
            commands::calendar::get_today,
            commands::calendar::reschedule_session,
            commands::calendar::reschedule_missed,
            // Session
            commands::session::get_session,
            commands::session::get_session_phases,
            commands::session::complete_phase,
            commands::session::complete_session,
            commands::session::get_session_history,
            // Intelligence
            commands::intelligence::get_recall_probability,
            commands::intelligence::update_spaced_rep,
            commands::intelligence::get_review_queue,
            commands::intelligence::update_bayesian,
            commands::intelligence::get_mastery,
            commands::intelligence::run_forecast,
            commands::intelligence::get_daily_plan,
            commands::intelligence::get_review_stats,
            commands::intelligence::get_behavioral_alerts,
            // Curriculum
            commands::curriculum::get_domains,
            commands::curriculum::get_topics,
            commands::curriculum::get_all_topics,
            // Quiz
            commands::quiz::generate_quiz,
            commands::quiz::submit_quiz_answer,
            commands::quiz::complete_quiz,
            // Export
            commands::export::export_json,
            commands::export::import_json,
            commands::export::export_to_file,
            commands::export::import_from_file,
            commands::export::export_csv_to_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
