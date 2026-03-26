import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type {
  User, Session, SessionPhase, Week, Calendar, Quiz, QuizResults,
  DailyPlan, Theme, Domain, Topic, SpacedRepState, BehavioralAlert,
  WeekWithSessions,
} from '../types/models';

// ── Tauri Detection ─────────────────────────────────────────────────────
// Static import so test mocks work. At runtime, tauriInvoke is undefined
// in browsers (no __TAURI_INTERNALS__) — the typeof check routes to the
// localStorage-backed mock layer instead.

// ── Browser Mock Layer ──────────────────────────────────────────────────

const LS_USERS_KEY = 'cortex_users';
const LS_CALENDAR_KEY = 'cortex_calendar';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

function buildMockCalendar(): Calendar {
  const weeks: WeekWithSessions[] = [];
  const startDate = new Date('2026-03-02');
  for (let w = 1; w <= 43; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (w - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
    const weekId = `week-${w}`;
    const sessions: import('../types/models').Session[] = [];
    for (let d = 0; d < 5; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      sessions.push({
        id: `session-${w}-${d}`,
        week_id: weekId,
        date: date.toISOString().slice(0, 10),
        day_of_week: d + 1,
        status: 'scheduled',
        rescheduled_to: null,
        topics_json: null,
        tags_json: null,
        time_spent_min: null,
        retrieval_score: null,
        confidence: null,
        energy_level: null,
        notes: null,
        completed_at: null,
      });
    }
    weeks.push({
      week: {
        id: weekId,
        week_num: w,
        start_date: weekStart.toISOString().slice(0, 10),
        end_date: weekEnd.toISOString().slice(0, 10),
        objective: `Week ${w} objectives`,
        status: 'scheduled',
      },
      sessions,
      aggregate: null,
    });
  }
  return { weeks, milestones: [], total_sessions: 215, completed_sessions: 0, attendance_rate: 0 };
}

const MOCK_DOMAINS: Domain[] = [
  { id: 'power-bi', name: 'Power BI', slug: 'power-bi', color: '#F2C811', icon: null, sort_order: 1, is_custom: false },
  { id: 'business-intelligence', name: 'Business Intelligence', slug: 'business-intelligence', color: '#7C6BF0', icon: null, sort_order: 2, is_custom: false },
  { id: 'operations', name: 'Operations', slug: 'operations', color: '#FF6B6B', icon: null, sort_order: 3, is_custom: false },
  { id: 'logistics', name: 'Logistics & Supply Chain', slug: 'logistics', color: '#4ECDC4', icon: null, sort_order: 4, is_custom: false },
];

async function browserMock<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const a = args ?? {};
  switch (cmd) {
    case 'list_users':
      return lsGet(LS_USERS_KEY, []) as T;
    case 'create_user': {
      const user: User = {
        id: generateId(),
        name: (a.name as string) || 'Learner',
        email: null,
        avatar_seed: null,
        theme: (a.theme as Theme) || 'glass',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const users = lsGet<User[]>(LS_USERS_KEY, []);
      users.push(user);
      lsSet(LS_USERS_KEY, users);
      return user as T;
    }
    case 'get_user': {
      const users = lsGet<User[]>(LS_USERS_KEY, []);
      const found = users.find((u) => u.id === a.id);
      if (!found) throw new Error('User not found');
      return found as T;
    }
    case 'set_theme': {
      const users = lsGet<User[]>(LS_USERS_KEY, []);
      const idx = users.findIndex((u) => u.id === a.userId);
      if (idx >= 0) { users[idx].theme = a.theme as Theme; lsSet(LS_USERS_KEY, users); }
      return undefined as T;
    }
    case 'init_calendar':
    case 'get_calendar': {
      let cal = lsGet<Calendar | null>(LS_CALENDAR_KEY, null);
      if (!cal) { cal = buildMockCalendar(); lsSet(LS_CALENDAR_KEY, cal); }
      return cal as T;
    }
    case 'uncomplete_session': {
      const cal = lsGet<Calendar | null>(LS_CALENDAR_KEY, null);
      if (cal) {
        for (const wk of cal.weeks) {
          const s = wk.sessions.find((s) => s.id === a.sessionId);
          if (s) { s.status = 'scheduled' as import('../types/models').SessionStatus; s.completed_at = null; s.time_spent_min = null; break; }
        }
        // Recount completed
        cal.completed_sessions = cal.weeks.reduce((sum, w) => sum + w.sessions.filter((s) => s.status === 'completed').length, 0);
        cal.attendance_rate = cal.total_sessions > 0 ? cal.completed_sessions / cal.total_sessions : 0;
        lsSet(LS_CALENDAR_KEY, cal);
      }
      return undefined as T;
    }
    case 'complete_session': {
      const cal = lsGet<Calendar | null>(LS_CALENDAR_KEY, null);
      if (cal) {
        for (const wk of cal.weeks) {
          const s = wk.sessions.find((s) => s.id === a.sessionId);
          if (s) {
            s.status = 'completed' as import('../types/models').SessionStatus;
            s.completed_at = new Date().toISOString();
            s.time_spent_min = (a.timeSpentMin as number) ?? 30;
            s.retrieval_score = (a.retrievalScore as number) ?? null;
            s.confidence = (a.confidence as number) ?? null;
            s.energy_level = (a.energyLevel as number) ?? null;
            s.notes = (a.notes as string) ?? null;
            break;
          }
        }
        cal.completed_sessions = cal.weeks.reduce((sum, w) => sum + w.sessions.filter((s) => s.status === 'completed').length, 0);
        cal.attendance_rate = cal.total_sessions > 0 ? cal.completed_sessions / cal.total_sessions : 0;
        lsSet(LS_CALENDAR_KEY, cal);
      }
      return undefined as T;
    }
    case 'complete_phase':
      return undefined as T;
    case 'get_today':
      return null as T;
    case 'get_domains':
      return MOCK_DOMAINS as T;
    case 'get_topics':
    case 'get_all_topics':
      return [] as T;
    case 'get_review_stats':
      return [] as T;
    case 'get_behavioral_alerts':
      return [] as T;
    case 'get_daily_plan':
      return { time_allocation: { retrieval_min: 15, new_learning_min: 25, micro_task_min: 15, reflection_min: 5 }, topic_ids: [], emphasis: 'balanced', rationale: 'Default plan' } as T;
    case 'run_forecast':
      return [0.65, 0.45, 0.82] as T;
    case 'get_session_phases':
      return [] as T;
    case 'reschedule_missed':
      return 0 as T;
    case 'export_json':
      return JSON.stringify({ exported: new Date().toISOString(), users: lsGet(LS_USERS_KEY, []) }) as T;
    default:
      console.warn(`[browser-mock] Unhandled command: ${cmd}`);
      return undefined as T;
  }
}

// ── Unified Invoke ──────────────────────────────────────────────────────

let _showErrorToast: ((message: string) => void) | null = null;

export function registerToastHandler(handler: (message: string) => void): void {
  _showErrorToast = handler;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    // tauriInvoke is a real function in Tauri + in test mocks, undefined in browser
    if (typeof tauriInvoke === 'function') {
      return await tauriInvoke<T>(cmd, args);
    }
    return await browserMock<T>(cmd, args);
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

export async function uncompleteSession(sessionId: string): Promise<void> {
  return invoke('uncomplete_session', { sessionId });
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
