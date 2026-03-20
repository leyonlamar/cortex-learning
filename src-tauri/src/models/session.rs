#![allow(dead_code)]
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    Scheduled,
    Completed,
    Missed,
    Rescheduled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PhaseType {
    Retrieval,
    Learning,
    MicroTask,
    Reflection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub week_id: String,
    pub date: String,
    pub day_of_week: u8,
    pub status: SessionStatus,
    pub rescheduled_to: Option<String>,
    pub topics_json: Option<String>,
    pub tags_json: Option<String>,
    pub time_spent_min: Option<i32>,
    pub retrieval_score: Option<f64>,
    pub confidence: Option<i32>,
    pub energy_level: Option<i32>,
    pub notes: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionPhase {
    pub id: String,
    pub session_id: String,
    pub phase: PhaseType,
    pub duration_min: Option<i32>,
    pub content: Option<String>,
    pub score: Option<f64>,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Week {
    pub id: String,
    pub week_num: u32,
    pub start_date: String,
    pub end_date: String,
    pub objective: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeeklyAggregate {
    pub week_id: String,
    pub total_hours: Option<f64>,
    pub quiz_score: Option<f64>,
    pub mastery_delta: Option<f64>,
    pub trend_direction: Option<String>,
    pub variance_from_projection: Option<f64>,
    pub attendance_rate: Option<f64>,
    pub computed_at: String,
}

/// Reflection data submitted when completing a session
#[derive(Debug, Clone, Deserialize)]
pub struct ReflectionData {
    pub confidence: i32,
    pub energy_level: i32,
    pub notes: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Phase data submitted when completing a phase
#[derive(Debug, Clone, Deserialize)]
pub struct PhaseData {
    pub phase: PhaseType,
    pub duration_min: i32,
    pub content: Option<String>,
    pub score: Option<f64>,
}

/// Summary returned after session completion
#[derive(Debug, Clone, Serialize)]
pub struct SessionSummary {
    pub session: Session,
    pub phases: Vec<SessionPhase>,
    pub streak: u32,
    pub mastery_delta: f64,
    pub alerts: Vec<String>,
}

/// Context returned for the Today View
#[derive(Debug, Clone, Serialize)]
pub struct DayContext {
    pub session: Session,
    pub week: Week,
    pub daily_plan: Option<super::forecast::DailyPlan>,
    pub review_queue: Vec<ReviewItem>,
    pub streak: u32,
    pub week_progress: WeekProgress,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReviewItem {
    pub topic_id: String,
    pub topic_name: String,
    pub domain_slug: String,
    pub recall_probability: f64,
    pub last_reviewed: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WeekProgress {
    pub completed: u32,
    pub total: u32,
    pub mastery_delta: f64,
    pub energy_avg: f64,
}

/// Full calendar structure
#[derive(Debug, Clone, Serialize)]
pub struct Calendar {
    pub weeks: Vec<WeekWithSessions>,
    pub milestones: Vec<Milestone>,
    pub total_sessions: u32,
    pub completed_sessions: u32,
    pub attendance_rate: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct WeekWithSessions {
    pub week: Week,
    pub sessions: Vec<Session>,
    pub aggregate: Option<WeeklyAggregate>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Milestone {
    pub label: String,
    pub percent: u32,
    pub week_id: String,
    pub reached: bool,
}
