#![allow(dead_code)]
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum QuestionType {
    Recall,
    Applied,
    Synthesis,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCategory {
    RecallFailure,
    ApplicationError,
    SynthesisGap,
    Careless,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quiz {
    pub id: String,
    pub week_id: String,
    pub date: String,
    pub status: String,
    pub total_score: Option<f64>,
    pub difficulty_weighted_score: Option<f64>,
    pub time_spent_min: Option<i32>,
    pub completed_at: Option<String>,
    pub questions: Vec<QuizQuestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuizQuestion {
    pub id: String,
    pub quiz_id: String,
    pub topic_id: Option<String>,
    pub question_type: QuestionType,
    pub difficulty: f64,
    pub question_text: String,
    pub options_json: Option<String>,
    pub correct_answer: String,
    pub user_answer: Option<String>,
    pub is_correct: Option<bool>,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct QuizResults {
    pub quiz_id: String,
    pub raw_score: f64,
    pub weighted_score: f64,
    pub total_questions: u32,
    pub correct_count: u32,
    pub category_breakdown: CategoryBreakdown,
    pub error_taxonomy: Vec<ErrorEntry>,
    pub rolling_4_week_avg: f64,
    pub topics_to_review: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CategoryBreakdown {
    pub recall: CategoryScore,
    pub applied: CategoryScore,
    pub synthesis: CategoryScore,
}

#[derive(Debug, Clone, Serialize)]
pub struct CategoryScore {
    pub total: u32,
    pub correct: u32,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorEntry {
    pub question_id: String,
    pub category: ErrorCategory,
    pub topic_name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct QuizSummary {
    pub quiz_id: String,
    pub week_id: String,
    pub date: String,
    pub raw_score: f64,
    pub weighted_score: f64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AnswerResult {
    pub question_id: String,
    pub is_correct: bool,
    pub correct_answer: String,
}
