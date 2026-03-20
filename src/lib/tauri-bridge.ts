import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type {
  User, Session, SessionPhase, Week, Calendar, Quiz, QuizResults,
  DailyPlan, Theme, Domain, Topic, SpacedRepState, BehavioralAlert,
} from '../types/models';

// Module-level toast callback — wired up by App.tsx after the ToastProvider mounts.
let _showErrorToast: ((message: string) => void) | null = null;

export function registerToastHandler(handler: (message: string) => void): void {
  _showErrorToast = handler;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await tauriInvoke<T>(cmd, args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    _showErrorToast?.(`[${cmd}] ${message}`);
    throw err;
  }
}

// ── User Commands ───────────────────────────────────────────────────────

export async function createUser(name: string, theme: Theme = 'glass'): Promise<User> {
  return invoke('create_user', { name, theme });
}

export async function getUser(id: string): Promise<User> {
  return invoke('get_user', { id });
}

export async function setTheme(userId: string, theme: Theme): Promise<void> {
  return invoke('set_theme', { userId, theme });
}

export async function listUsers(): Promise<User[]> {
  return invoke('list_users');
}

// ── Curriculum Commands ─────────────────────────────────────────────────

export async function getDomains(): Promise<Domain[]> {
  return invoke('get_domains');
}

export async function getTopicsByDomain(domainId: string): Promise<Topic[]> {
  return invoke('get_topics', { domainId });
}

export async function getAllTopics(): Promise<Topic[]> {
  return invoke('get_all_topics');
}

// ── Calendar Commands ───────────────────────────────────────────────────

export async function initCalendar(): Promise<Calendar> {
  return invoke('init_calendar');
}

export async function getWeek(weekId: string): Promise<Week> {
  return invoke('get_week', { weekId });
}

export async function getToday(): Promise<Session | null> {
  return invoke('get_today');
}

export async function rescheduleSession(sessionId: string): Promise<string | null> {
  return invoke('reschedule_session', { sessionId });
}

export async function rescheduleMissed(): Promise<number> {
  return invoke('reschedule_missed');
}

// ── Session Commands ────────────────────────────────────────────────────

export async function getSession(sessionId: string): Promise<Session> {
  return invoke('get_session', { sessionId });
}

export async function getSessionPhases(sessionId: string): Promise<SessionPhase[]> {
  return invoke('get_session_phases', { sessionId });
}

export async function completePhase(
  sessionId: string,
  phase: string,
  durationMin: number,
  content: string | null,
  score: number | null,
  sortOrder: number,
): Promise<void> {
  return invoke('complete_phase', { sessionId, phase, durationMin, content, score, sortOrder });
}

export async function completeSession(
  sessionId: string,
  timeSpentMin: number,
  retrievalScore: number,
  confidence: number,
  energyLevel: number,
  notes: string | null,
): Promise<void> {
  return invoke('complete_session', {
    sessionId, timeSpentMin, retrievalScore, confidence, energyLevel, notes,
  });
}

export async function getSessionHistory(weekId: string): Promise<Session[]> {
  return invoke('get_session_history', { weekId });
}

// ── Intelligence Commands ───────────────────────────────────────────────

export async function getRecallProbability(dtHours: number, memoryStrength: number): Promise<number> {
  return invoke('get_recall_probability', { dtHours, memoryStrength });
}

export async function updateSpacedRep(
  topicId: string, score: number, currentStrength: number,
): Promise<[number, number]> {
  return invoke('update_spaced_rep', { topicId, score, currentStrength });
}

export async function getReviewQueue(recallProbs: number[], limit: number): Promise<number[]> {
  return invoke('get_review_queue', { recallProbs, limit });
}

export async function updateBayesian(
  topicId: string, correct: boolean, weight: number,
): Promise<[number, number]> {
  return invoke('update_bayesian', { topicId, correct, weight });
}

export async function getMastery(
  topicId: string,
): Promise<[number, number, number, number]> {
  return invoke('get_mastery', { topicId });
}

export async function runForecast(
  attendanceRate: number, quizAvg: number, weeksRemaining: number, simCount: number,
): Promise<[number, number, number]> {
  return invoke('run_forecast', { attendanceRate, quizAvg, weeksRemaining, simCount });
}

export async function getDailyPlan(topicIds: string[]): Promise<DailyPlan> {
  return invoke('get_daily_plan', { topicIds });
}

export async function getReviewStats(): Promise<SpacedRepState[]> {
  return invoke('get_review_stats');
}

export async function getBehavioralAlerts(): Promise<BehavioralAlert[]> {
  return invoke('get_behavioral_alerts');
}

// ── Quiz Commands ───────────────────────────────────────────────────────

export async function generateQuiz(
  weekId: string,
  topics: [string, string, string, number][],  // [id, name, slug, review_count]
  totalQuestions: number,
): Promise<Quiz> {
  return invoke('generate_quiz', { weekId, topics, totalQuestions });
}

export async function submitQuizAnswer(questionId: string, userAnswer: string): Promise<boolean> {
  return invoke('submit_quiz_answer', { questionId, userAnswer });
}

export async function completeQuiz(quizId: string): Promise<QuizResults> {
  return invoke('complete_quiz', { quizId });
}

// ── Export Commands ─────────────────────────────────────────────────────

export async function exportJson(): Promise<string> {
  return invoke('export_json');
}

export async function importJson(json: string): Promise<void> {
  return invoke('import_json', { json });
}

export async function exportToFile(path: string): Promise<void> {
  return invoke('export_to_file', { path });
}

export async function importFromFile(path: string): Promise<void> {
  return invoke('import_from_file', { path });
}

export async function exportCsvToFile(path: string): Promise<string> {
  return invoke('export_csv_to_file', { path });
}
