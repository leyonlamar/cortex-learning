use chrono::NaiveDate;
use tauri::State;
use crate::commands::user::DbState;
use crate::error::AppError;
use crate::models::session::{Week, Session, Calendar, WeekWithSessions, Milestone};
use crate::engine::calendar;
use crate::db::queries;

#[tauri::command]
pub fn init_calendar(db: State<'_, DbState>) -> Result<Calendar, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;

    // Check if calendar already exists — make this idempotent
    let week_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM weeks", [], |row| row.get(0))
        .unwrap_or(0);

    if week_count > 0 {
        // Return existing calendar data
        let mut stmt = conn.prepare(
            "SELECT id, week_num, start_date, end_date, objective, status FROM weeks ORDER BY week_num"
        )?;
        let weeks: Vec<Week> = stmt
            .query_map([], |row| {
                Ok(Week {
                    id: row.get(0)?,
                    week_num: row.get(1)?,
                    start_date: row.get(2)?,
                    end_date: row.get(3)?,
                    objective: row.get(4)?,
                    status: row.get(5)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        let total_sessions: i64 = conn
            .query_row("SELECT COUNT(*) FROM sessions", [], |row| row.get(0))
            .unwrap_or(0);
        let completed_sessions: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sessions WHERE status = 'completed'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);
        let attendance_rate = if total_sessions > 0 {
            completed_sessions as f64 / total_sessions as f64
        } else {
            0.0
        };

        let milestones = build_milestones(weeks.len() as u32);

        let week_data: Vec<WeekWithSessions> = weeks
            .into_iter()
            .map(|w| {
                let sessions = queries::get_sessions_by_week(&conn, &w.id).unwrap_or_default();
                let aggregate = queries::get_weekly_aggregate(&conn, &w.id);
                WeekWithSessions { week: w, sessions, aggregate }
            })
            .collect();

        return Ok(Calendar {
            weeks: week_data,
            milestones,
            total_sessions: total_sessions as u32,
            completed_sessions: completed_sessions as u32,
            attendance_rate,
        });
    }

    let start = NaiveDate::from_ymd_opt(2026, 3, 2).unwrap();
    let end = NaiveDate::from_ymd_opt(2026, 12, 25).unwrap();
    let (weeks, sessions, milestones) = calendar::generate_calendar(start, end);

    for w in &weeks {
        queries::insert_week(&conn, w)?;
    }
    for s in &sessions {
        queries::insert_session(&conn, s)?;
    }

    Ok(Calendar {
        weeks: weeks.into_iter().map(|w| WeekWithSessions {
            week: w,
            sessions: vec![],
            aggregate: None,
        }).collect(),
        milestones,
        total_sessions: sessions.len() as u32,
        completed_sessions: 0,
        attendance_rate: 0.0,
    })
}

fn build_milestones(total_weeks: u32) -> Vec<Milestone> {
    vec![
        Milestone {
            label: "25%".to_string(),
            percent: 25,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.25).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "50%".to_string(),
            percent: 50,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.50).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "75%".to_string(),
            percent: 75,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.75).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "100%".to_string(),
            percent: 100,
            week_id: format!("W{:02}", total_weeks),
            reached: false,
        },
    ]
}

#[tauri::command]
pub fn get_week(db: State<'_, DbState>, week_id: String) -> Result<Week, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    queries::get_week(&conn, &week_id)
}

#[tauri::command]
pub fn get_today(db: State<'_, DbState>) -> Result<Option<Session>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    match conn.query_row(
        "SELECT id FROM sessions WHERE date = ?1",
        rusqlite::params![today],
        |row| row.get::<_, String>(0),
    ) {
        Ok(id) => Ok(Some(queries::get_session(&conn, &id)?)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(AppError::Database(e.to_string())),
    }
}

#[tauri::command]
pub fn reschedule_session(
    db: State<'_, DbState>,
    session_id: String,
) -> Result<Option<String>, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let session = queries::get_session(&conn, &session_id)?;
    let from_date = NaiveDate::parse_from_str(&session.date, "%Y-%m-%d")
        .map_err(|e| AppError::Validation(e.to_string()))?;
    let end = NaiveDate::from_ymd_opt(2026, 12, 25).unwrap();

    // Get all booked dates
    let mut stmt = conn.prepare("SELECT date FROM sessions WHERE status != 'missed'")?;
    let booked: Vec<NaiveDate> = stmt
        .query_map([], |row| {
            let d: String = row.get(0)?;
            Ok(NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())
        })?
        .filter_map(|r| r.ok().flatten())
        .collect();

    match calendar::find_next_available_weekday(from_date, &booked, end) {
        Some(new_date) => {
            let new_date_str = new_date.format("%Y-%m-%d").to_string();
            conn.execute(
                "UPDATE sessions SET status = 'rescheduled', rescheduled_to = ?1 WHERE id = ?2",
                rusqlite::params![new_date_str, session_id],
            )?;
            Ok(Some(new_date_str))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn reschedule_missed(db: State<'_, DbState>) -> Result<u32, AppError> {
    let conn = db.0.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let end = NaiveDate::from_ymd_opt(2026, 12, 25).unwrap();

    // Fetch all missed session ids and dates
    let mut stmt = conn.prepare("SELECT id, date FROM sessions WHERE status = 'missed'")?;
    let missed: Vec<(String, NaiveDate)> = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let date_str: String = row.get(1)?;
            Ok((id, date_str))
        })?
        .filter_map(|r| r.ok())
        .filter_map(|(id, date_str)| {
            NaiveDate::parse_from_str(&date_str, "%Y-%m-%d").ok().map(|d| (id, d))
        })
        .collect();

    let mut rescheduled_count: u32 = 0;

    for (session_id, from_date) in missed {
        // Recompute booked dates each iteration so we don't double-book
        let mut booked_stmt = conn.prepare("SELECT date FROM sessions WHERE status != 'missed'")?;
        let booked: Vec<NaiveDate> = booked_stmt
            .query_map([], |row| {
                let d: String = row.get(0)?;
                Ok(NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())
            })?
            .filter_map(|r| r.ok().flatten())
            .collect();

        if let Some(new_date) = calendar::find_next_available_weekday(from_date, &booked, end) {
            let new_date_str = new_date.format("%Y-%m-%d").to_string();
            conn.execute(
                "UPDATE sessions SET status = 'rescheduled', rescheduled_to = ?1 WHERE id = ?2",
                rusqlite::params![new_date_str, session_id],
            )?;
            rescheduled_count += 1;
        }
    }

    Ok(rescheduled_count)
}
