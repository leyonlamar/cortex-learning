#![allow(dead_code)]
use serde::{Deserialize, Serialize};

/// Monte Carlo forecast result
#[derive(Debug, Clone, Serialize)]
pub struct Forecast {
    pub id: String,
    pub computed_at: String,
    pub sim_count: u32,
    pub attendance: PercentileResult,
    pub quiz_avg: PercentileResult,
    pub completion_confidence: f64,
    pub distribution_json: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PercentileResult {
    pub p10: f64,
    pub p25: f64,
    pub median: f64,
    pub p75: f64,
    pub p90: f64,
}

/// Scenario input for what-if analysis
#[derive(Debug, Clone, Deserialize)]
pub struct ScenarioInput {
    pub label: String,
    pub attendance_override: Option<f64>,
    pub study_time_override: Option<f64>,
    pub break_weeks: Option<Vec<u32>>,
}

/// Daily plan from RL scheduler
#[derive(Debug, Clone, Serialize)]
pub struct DailyPlan {
    pub time_allocation: TimeAllocation,
    pub topic_ids: Vec<String>,
    pub emphasis: Emphasis,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TimeAllocation {
    pub retrieval_min: u32,
    pub new_learning_min: u32,
    pub micro_task_min: u32,
    pub reflection_min: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Emphasis {
    NewMaterial,
    ReviewHeavy,
    QuizPrep,
    Balanced,
}

/// Spaced repetition state for a topic
#[derive(Debug, Clone, Serialize)]
pub struct SpacedRepState {
    pub topic_id: String,
    pub memory_strength: f64,
    pub last_reviewed: Option<String>,
    pub next_review: Option<String>,
    pub recall_probability: f64,
    pub review_count: u32,
}

/// Bayesian mastery for a topic
#[derive(Debug, Clone, Serialize)]
pub struct TopicMastery {
    pub topic_id: String,
    pub topic_name: String,
    pub domain_slug: String,
    pub alpha: f64,
    pub beta_param: f64,
    pub mastery: f64,
    pub uncertainty: f64,
    pub ci_lower: f64,
    pub ci_upper: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct TopicUncertainty {
    pub topic_id: String,
    pub topic_name: String,
    pub uncertainty: f64,
    pub data_points: u32,
}

/// Retention heatmap data
#[derive(Debug, Clone, Serialize)]
pub struct RetentionMap {
    pub topics: Vec<RetentionEntry>,
    pub avg_recall: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct RetentionEntry {
    pub topic_id: String,
    pub topic_name: String,
    pub domain_slug: String,
    pub recall_probability: f64,
    pub memory_strength: f64,
}

/// Behavioral alert
#[derive(Debug, Clone, Serialize)]
pub struct BehavioralAlert {
    pub id: String,
    pub date: String,
    pub event_type: String,
    pub severity: String,
    pub message: String,
    pub acknowledged: bool,
}

/// RL performance comparison
#[derive(Debug, Clone, Serialize)]
pub struct PerformanceComparison {
    pub rl_avg_score: f64,
    pub baseline_avg_score: f64,
    pub improvement_pct: f64,
    pub weeks_compared: u32,
}
