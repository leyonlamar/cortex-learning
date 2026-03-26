// ── Enums ───────────────────────────────────────────────────────────────

export type SessionStatus = 'scheduled' | 'completed' | 'missed' | 'rescheduled';
export type PhaseType = 'retrieval' | 'learning' | 'micro_task' | 'reflection';
export type QuestionType = 'recall' | 'applied' | 'synthesis';
export type ErrorCategory = 'recall_failure' | 'application_error' | 'synthesis_gap' | 'careless';
export type Emphasis = 'new_material' | 'review_heavy' | 'quiz_prep' | 'balanced';
export type Theme = 'glass' | 'executive' | 'brutalist' | 'console' | 'cyberpunk' | 'luxury' | 'nasa' | 'studyhall';

// ── User ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatar_seed: string | null;
  theme: Theme;
  created_at: string;
  updated_at: string;
}

// ── Domain & Topic ──────────────────────────────────────────────────────

export interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  sort_order: number;
  is_custom: boolean;
}

export interface Topic {
  id: string;
  domain_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  depth: number;
  created_at: string;
}

// ── Session ─────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  week_id: string;
  date: string;
  day_of_week: number;
  status: SessionStatus;
  rescheduled_to: string | null;
  topics_json: string | null;
  tags_json: string | null;
  time_spent_min: number | null;
  retrieval_score: number | null;
  confidence: number | null;
  energy_level: number | null;
  notes: string | null;
  completed_at: string | null;
}

export interface SessionPhase {
  id: string;
  session_id: string;
  phase: PhaseType;
  duration_min: number | null;
  content: string | null;
  score: number | null;
  sort_order: number;
}

export interface Week {
  id: string;
  week_num: number;
  start_date: string;
  end_date: string;
  objective: string | null;
  status: string;
}

export interface WeeklyAggregate {
  week_id: string;
  total_hours: number | null;
  quiz_score: number | null;
  mastery_delta: number | null;
  trend_direction: string | null;
  variance_from_projection: number | null;
  attendance_rate: number | null;
  computed_at: string;
}

// ── Calendar ────────────────────────────────────────────────────────────

export interface Calendar {
  weeks: WeekWithSessions[];
  milestones: Milestone[];
  total_sessions: number;
  completed_sessions: number;
  attendance_rate: number;
}

export interface WeekWithSessions {
  week: Week;
  sessions: Session[];
  aggregate: WeeklyAggregate | null;
}

export interface Milestone {
  label: string;
  percent: number;
  week_id: string;
  reached: boolean;
}

// ── Quiz ────────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  week_id: string;
  date: string;
  status: string;
  total_score: number | null;
  difficulty_weighted_score: number | null;
  time_spent_min: number | null;
  completed_at: string | null;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  topic_id: string | null;
  question_type: QuestionType;
  difficulty: number;
  question_text: string;
  options_json: string | null;
  correct_answer: string;
  user_answer: string | null;
  is_correct: boolean | null;
  sort_order: number;
}

export interface QuizResults {
  quiz_id: string;
  raw_score: number;
  weighted_score: number;
  total_questions: number;
  correct_count: number;
  category_breakdown: CategoryBreakdown;
  error_taxonomy: ErrorEntry[];
  rolling_4_week_avg: number;
  topics_to_review: string[];
}

export interface CategoryBreakdown {
  recall: CategoryScore;
  applied: CategoryScore;
  synthesis: CategoryScore;
}

export interface CategoryScore {
  total: number;
  correct: number;
  score: number;
}

export interface ErrorEntry {
  question_id: string;
  category: ErrorCategory;
  topic_name: string;
}

// ── Forecast / Intelligence ─────────────────────────────────────────────

export interface DailyPlan {
  time_allocation: TimeAllocation;
  topic_ids: string[];
  emphasis: Emphasis;
  rationale: string;
}

export interface TimeAllocation {
  retrieval_min: number;
  new_learning_min: number;
  micro_task_min: number;
  reflection_min: number;
}

export interface SpacedRepState {
  topic_id: string;
  memory_strength: number;
  last_reviewed: string | null;
  next_review: string | null;
  recall_probability: number;
  review_count: number;
}

export interface BehavioralAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
}

export interface TopicMastery {
  topic_id: string;
  topic_name: string;
  domain_slug: string;
  alpha: number;
  beta_param: number;
  mastery: number;
  uncertainty: number;
  ci_lower: number;
  ci_upper: number;
}

// ── Notes ──────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  domain_slug: string | null;
  topic_slug: string | null;
  session_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

// ── Flashcards ─────────────────────────────────────────────────────────

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  domain_slug: string;
  topic_slug: string;
  difficulty: number;
  interval_days: number;
  ease_factor: number;
  next_review: string;
  review_count: number;
  last_reviewed: string | null;
}

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

// ── Achievements ───────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'mastery' | 'milestone' | 'special';
  xp: number;
  unlocked: boolean;
  unlocked_at: string | null;
  progress: number;
  target: number;
}

export interface XpState {
  total_xp: number;
  level: number;
  xp_to_next: number;
  current_streak: number;
  longest_streak: number;
}

// ── Focus Timer ────────────────────────────────────────────────────────

export type TimerMode = 'work' | 'short_break' | 'long_break';

export interface FocusSession {
  id: string;
  started_at: string;
  completed_at: string | null;
  mode: TimerMode;
  duration_min: number;
  completed: boolean;
  domain_slug: string | null;
}
