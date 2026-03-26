import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type {
  User, Session, SessionPhase, Week, Calendar, Quiz, QuizResults,
  DailyPlan, Theme, Domain, Topic, SpacedRepState, BehavioralAlert,
  WeekWithSessions, Note, Flashcard, FlashcardRating, Achievement, XpState, FocusSession,
} from '../types/models';
import { allLessons } from '../data/curriculum';

// ── Tauri Detection ─────────────────────────────────────────────────────
// Static import so test mocks work. At runtime, tauriInvoke is undefined
// in browsers (no __TAURI_INTERNALS__) — the typeof check routes to the
// localStorage-backed mock layer instead.

// ── Browser Mock Layer ──────────────────────────────────────────────────

const LS_USERS_KEY = 'cortex_users';
const LS_CALENDAR_KEY = 'cortex_calendar';
const LS_NOTES_KEY = 'cortex_notes';
const LS_FLASHCARDS_KEY = 'cortex_flashcards';
const LS_ACHIEVEMENTS_KEY = 'cortex_achievements';
const LS_XP_KEY = 'cortex_xp';
const LS_FOCUS_KEY = 'cortex_focus_sessions';

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

const LS_PROGRAM_START_KEY = 'cortex_program_start';

function getProgramStart(): Date {
  const stored = localStorage.getItem(LS_PROGRAM_START_KEY);
  if (stored) return new Date(stored);
  // Default to Monday of the current week
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  localStorage.setItem(LS_PROGRAM_START_KEY, monday.toISOString().slice(0, 10));
  return monday;
}

function buildMockCalendar(): Calendar {
  const weeks: WeekWithSessions[] = [];
  const startDate = getProgramStart();
  let lessonIdx = 0;
  for (let w = 1; w <= 43; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (w - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
    const weekId = `week-${w}`;
    const sessions: import('../types/models').Session[] = [];
    const weekTopics: string[] = [];
    for (let d = 0; d < 5; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      // Assign actual lesson content to each session
      const lesson = lessonIdx < allLessons.length ? allLessons[lessonIdx] : null;
      lessonIdx++;
      const topicInfo = lesson
        ? { domain: lesson.domainSlug, topic: lesson.topicName, title: lesson.title }
        : null;
      if (topicInfo) weekTopics.push(topicInfo.topic);
      sessions.push({
        id: `session-${w}-${d}`,
        week_id: weekId,
        date: date.toISOString().slice(0, 10),
        day_of_week: d + 1,
        status: 'scheduled',
        rescheduled_to: null,
        topics_json: topicInfo ? JSON.stringify(topicInfo) : null,
        tags_json: null,
        time_spent_min: null,
        retrieval_score: null,
        confidence: null,
        energy_level: null,
        notes: null,
        completed_at: null,
      });
    }
    const uniqueTopics = [...new Set(weekTopics)];
    weeks.push({
      week: {
        id: weekId,
        week_num: w,
        start_date: weekStart.toISOString().slice(0, 10),
        end_date: weekEnd.toISOString().slice(0, 10),
        objective: uniqueTopics.length > 0 ? uniqueTopics.join(' · ') : `Week ${w}`,
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
      let cal = lsGet<Calendar & { _v?: number } | null>(LS_CALENDAR_KEY, null);
      // Validate structure — rebuild if stale/corrupt or missing version
      const CALENDAR_VERSION = 2;
      if (
        !cal ||
        !Array.isArray(cal.weeks) ||
        (cal.weeks.length > 0 && !Array.isArray(cal.weeks[0]?.sessions)) ||
        (cal as Calendar & { _v?: number })._v !== CALENDAR_VERSION
      ) {
        cal = { ...buildMockCalendar(), _v: CALENDAR_VERSION } as Calendar & { _v: number };
        lsSet(LS_CALENDAR_KEY, cal);
      }
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
    case 'get_topics': {
      const domainId = a.domainId as string;
      const domainSlugMap: Record<string, string> = {
        'power-bi': 'power-bi',
        'business-intelligence': 'business-intelligence',
        'operations': 'operations',
        'logistics': 'logistics',
      };
      const slug = domainSlugMap[domainId] ?? domainId;
      const seen = new Set<string>();
      const topics: Topic[] = [];
      for (const l of allLessons) {
        if (l.domainSlug !== slug) continue;
        if (seen.has(l.topicSlug)) continue;
        seen.add(l.topicSlug);
        topics.push({
          id: `${l.domainSlug}::${l.topicSlug}`,
          domain_id: domainId,
          parent_id: null,
          name: l.topicName,
          slug: l.topicSlug,
          depth: 0,
          created_at: new Date().toISOString(),
        });
      }
      return topics as T;
    }
    case 'get_all_topics': {
      const seen = new Set<string>();
      const topics: Topic[] = [];
      for (const l of allLessons) {
        const key = `${l.domainSlug}::${l.topicSlug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const domainIdMap: Record<string, string> = {
          'power-bi': 'power-bi',
          'business-intelligence': 'business-intelligence',
          'operations': 'operations',
          'logistics': 'logistics',
        };
        topics.push({
          id: key,
          domain_id: domainIdMap[l.domainSlug] ?? l.domainSlug,
          parent_id: null,
          name: l.topicName,
          slug: l.topicSlug,
          depth: 0,
          created_at: new Date().toISOString(),
        });
      }
      return topics as T;
    }
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

    // ── Quiz ───────────────────────────────────────────────────────────
    case 'generate_quiz': {
      const topics = (a.topics as [string, string, string, number][]) || [];
      const totalQ = (a.totalQuestions as number) || 10;
      const weekId = (a.weekId as string) || 'W01';
      const quizId = generateId();
      const questionTypes: import('../types/models').QuestionType[] = ['recall', 'applied', 'synthesis'];
      const questions: import('../types/models').QuizQuestion[] = [];
      for (let i = 0; i < totalQ; i++) {
        const topicTuple = topics[i % topics.length];
        const qType = questionTypes[i % 3];
        const topicName = topicTuple?.[1] ?? 'General';
        const topicSlug = topicTuple?.[2] ?? 'general';
        // Generate questions from lesson data
        const topicLessons = allLessons.filter((l) => l.topicSlug === topicSlug);
        const lesson = topicLessons[i % Math.max(1, topicLessons.length)];
        let questionText: string;
        let correctAnswer: string;
        let options: string[];
        if (qType === 'recall' && lesson) {
          questionText = `What is the key takeaway of "${lesson.title}"?`;
          correctAnswer = lesson.keyTakeaway;
          options = [lesson.keyTakeaway, `${topicName} is not relevant here`, `This topic has no practical applications`, `None of the above`];
        } else if (qType === 'applied' && lesson) {
          questionText = `Which success criterion applies to "${lesson.title}"?`;
          correctAnswer = lesson.successCriteria[0] ?? 'Complete all steps';
          options = [lesson.successCriteria[0] ?? 'Complete all steps', 'Skip the documentation', 'Use default settings only', 'Ignore error handling'];
        } else {
          questionText = `How does ${topicName} integrate with broader ${topicTuple?.[2] ?? ''} concepts?`;
          correctAnswer = `${topicName} builds foundational skills that connect across the domain`;
          options = [`${topicName} builds foundational skills that connect across the domain`, 'It operates independently', 'It only applies to one scenario', 'There is no integration'];
        }
        // Shuffle options
        const shuffled = [...options].sort(() => Math.random() - 0.5);
        questions.push({
          id: `${quizId}-q${i}`,
          quiz_id: quizId,
          topic_id: topicTuple?.[0] ?? null,
          question_type: qType,
          difficulty: 1 + (i % 3),
          question_text: questionText,
          options_json: JSON.stringify(shuffled),
          correct_answer: correctAnswer,
          user_answer: null,
          is_correct: null,
          sort_order: i,
        });
      }
      const quiz: Quiz = {
        id: quizId,
        week_id: weekId,
        date: new Date().toISOString().slice(0, 10),
        status: 'in_progress',
        total_score: null,
        difficulty_weighted_score: null,
        time_spent_min: null,
        completed_at: null,
        questions,
      };
      lsSet(`cortex_quiz_${quizId}`, quiz);
      return quiz as T;
    }
    case 'submit_quiz_answer': {
      const questionId = a.questionId as string;
      const userAnswer = a.userAnswer as string;
      // Find the quiz containing this question
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('cortex_quiz_'));
      for (const key of keys) {
        const quiz = lsGet<Quiz>(key, null as unknown as Quiz);
        if (!quiz?.questions) continue;
        const q = quiz.questions.find((qq) => qq.id === questionId);
        if (q) {
          q.user_answer = userAnswer;
          q.is_correct = q.correct_answer === userAnswer;
          lsSet(key, quiz);
          return q.is_correct as T;
        }
      }
      return false as T;
    }
    case 'complete_quiz': {
      const quizId = a.quizId as string;
      const quiz = lsGet<Quiz>(`cortex_quiz_${quizId}`, null as unknown as Quiz);
      if (!quiz) throw new Error('Quiz not found');
      quiz.status = 'completed';
      quiz.completed_at = new Date().toISOString();
      const correct = quiz.questions.filter((q) => q.is_correct).length;
      const total = quiz.questions.length;
      quiz.total_score = total > 0 ? Math.round((correct / total) * 100) : 0;
      quiz.difficulty_weighted_score = quiz.total_score;
      lsSet(`cortex_quiz_${quizId}`, quiz);
      const recallQs = quiz.questions.filter((q) => q.question_type === 'recall');
      const appliedQs = quiz.questions.filter((q) => q.question_type === 'applied');
      const synthesisQs = quiz.questions.filter((q) => q.question_type === 'synthesis');
      const catScore = (qs: typeof quiz.questions) => ({
        total: qs.length,
        correct: qs.filter((q) => q.is_correct).length,
        score: qs.length > 0 ? Math.round((qs.filter((q) => q.is_correct).length / qs.length) * 100) : 0,
      });
      const results: QuizResults = {
        quiz_id: quizId,
        raw_score: quiz.total_score,
        weighted_score: quiz.difficulty_weighted_score ?? quiz.total_score,
        total_questions: total,
        correct_count: correct,
        category_breakdown: {
          recall: catScore(recallQs),
          applied: catScore(appliedQs),
          synthesis: catScore(synthesisQs),
        },
        error_taxonomy: quiz.questions
          .filter((q) => !q.is_correct && q.user_answer)
          .map((q) => ({
            question_id: q.id,
            category: q.question_type === 'recall' ? 'recall_failure' as const : q.question_type === 'applied' ? 'application_error' as const : 'synthesis_gap' as const,
            topic_name: q.topic_id ?? 'Unknown',
          })),
        rolling_4_week_avg: quiz.total_score,
        topics_to_review: quiz.questions.filter((q) => !q.is_correct).map((q) => q.topic_id ?? '').filter(Boolean),
      };
      return results as T;
    }
    case 'export_json':
      return JSON.stringify({ exported: new Date().toISOString(), users: lsGet(LS_USERS_KEY, []), calendar: lsGet(LS_CALENDAR_KEY, null) }) as T;
    case 'export_csv_to_file':
      return 'Exported to clipboard (browser mode)' as T;
    case 'import_json':
      return undefined as T;

    // ── Notes ──────────────────────────────────────────────────────────
    case 'list_notes':
      return lsGet<Note[]>(LS_NOTES_KEY, []) as T;
    case 'create_note': {
      const note: Note = {
        id: generateId(),
        title: (a.title as string) || 'Untitled',
        content: (a.content as string) || '',
        tags: (a.tags as string[]) || [],
        domain_slug: (a.domainSlug as string) || null,
        topic_slug: (a.topicSlug as string) || null,
        session_id: (a.sessionId as string) || null,
        pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const notes = lsGet<Note[]>(LS_NOTES_KEY, []);
      notes.unshift(note);
      lsSet(LS_NOTES_KEY, notes);
      return note as T;
    }
    case 'update_note': {
      const notes = lsGet<Note[]>(LS_NOTES_KEY, []);
      const ni = notes.findIndex((n) => n.id === a.noteId);
      if (ni >= 0) {
        if (a.title !== undefined) notes[ni].title = a.title as string;
        if (a.content !== undefined) notes[ni].content = a.content as string;
        if (a.tags !== undefined) notes[ni].tags = a.tags as string[];
        if (a.pinned !== undefined) notes[ni].pinned = a.pinned as boolean;
        notes[ni].updated_at = new Date().toISOString();
        lsSet(LS_NOTES_KEY, notes);
        return notes[ni] as T;
      }
      throw new Error('Note not found');
    }
    case 'delete_note': {
      const notes = lsGet<Note[]>(LS_NOTES_KEY, []);
      lsSet(LS_NOTES_KEY, notes.filter((n) => n.id !== a.noteId));
      return undefined as T;
    }

    // ── Flashcards ─────────────────────────────────────────────────────
    case 'list_flashcards':
      return lsGet<Flashcard[]>(LS_FLASHCARDS_KEY, []) as T;
    case 'get_due_flashcards': {
      const cards = lsGet<Flashcard[]>(LS_FLASHCARDS_KEY, []);
      const now = new Date().toISOString();
      return cards.filter((c) => c.next_review <= now).sort(
        (x, y) => x.next_review.localeCompare(y.next_review)
      ) as T;
    }
    case 'create_flashcard': {
      const card: Flashcard = {
        id: generateId(),
        front: (a.front as string) || '',
        back: (a.back as string) || '',
        domain_slug: (a.domainSlug as string) || '',
        topic_slug: (a.topicSlug as string) || '',
        difficulty: 0,
        interval_days: 1,
        ease_factor: 2.5,
        next_review: new Date().toISOString(),
        review_count: 0,
        last_reviewed: null,
      };
      const cards = lsGet<Flashcard[]>(LS_FLASHCARDS_KEY, []);
      cards.push(card);
      lsSet(LS_FLASHCARDS_KEY, cards);
      return card as T;
    }
    case 'review_flashcard': {
      const cards = lsGet<Flashcard[]>(LS_FLASHCARDS_KEY, []);
      const ci = cards.findIndex((c) => c.id === a.cardId);
      if (ci >= 0) {
        const rating = a.rating as FlashcardRating;
        const c = cards[ci];
        const multipliers: Record<string, number> = { again: 0.5, hard: 0.8, good: 1.0, easy: 1.5 };
        const easeAdj: Record<string, number> = { again: -0.3, hard: -0.15, good: 0, easy: 0.15 };
        c.ease_factor = Math.max(1.3, c.ease_factor + (easeAdj[rating] ?? 0));
        c.interval_days = Math.max(1, Math.round(c.interval_days * c.ease_factor * (multipliers[rating] ?? 1)));
        const next = new Date();
        next.setDate(next.getDate() + c.interval_days);
        c.next_review = next.toISOString();
        c.review_count++;
        c.last_reviewed = new Date().toISOString();
        lsSet(LS_FLASHCARDS_KEY, cards);
        return c as T;
      }
      throw new Error('Flashcard not found');
    }

    // ── Achievements / XP ──────────────────────────────────────────────
    case 'get_achievements':
      return lsGet<Achievement[]>(LS_ACHIEVEMENTS_KEY, buildDefaultAchievements()) as T;
    case 'get_xp_state':
      return lsGet<XpState>(LS_XP_KEY, { total_xp: 0, level: 1, xp_to_next: 100, current_streak: 0, longest_streak: 0 }) as T;
    case 'award_xp': {
      const xp = lsGet<XpState>(LS_XP_KEY, { total_xp: 0, level: 1, xp_to_next: 100, current_streak: 0, longest_streak: 0 });
      xp.total_xp += (a.amount as number) || 0;
      while (xp.total_xp >= xp.xp_to_next) {
        xp.total_xp -= xp.xp_to_next;
        xp.level++;
        xp.xp_to_next = Math.round(100 * Math.pow(1.3, xp.level - 1));
      }
      lsSet(LS_XP_KEY, xp);
      return xp as T;
    }
    case 'unlock_achievement': {
      const achs = lsGet<Achievement[]>(LS_ACHIEVEMENTS_KEY, buildDefaultAchievements());
      const ai = achs.findIndex((ac) => ac.id === a.achievementId);
      if (ai >= 0 && !achs[ai].unlocked) {
        achs[ai].unlocked = true;
        achs[ai].unlocked_at = new Date().toISOString();
        lsSet(LS_ACHIEVEMENTS_KEY, achs);
      }
      return undefined as T;
    }
    case 'update_streak': {
      const xp = lsGet<XpState>(LS_XP_KEY, { total_xp: 0, level: 1, xp_to_next: 100, current_streak: 0, longest_streak: 0 });
      xp.current_streak = (a.streak as number) || 0;
      if (xp.current_streak > xp.longest_streak) xp.longest_streak = xp.current_streak;
      lsSet(LS_XP_KEY, xp);
      return xp as T;
    }

    // ── Focus Timer ────────────────────────────────────────────────────
    case 'list_focus_sessions':
      return lsGet<FocusSession[]>(LS_FOCUS_KEY, []) as T;
    case 'save_focus_session': {
      const fs: FocusSession = {
        id: generateId(),
        started_at: (a.startedAt as string) || new Date().toISOString(),
        completed_at: (a.completedAt as string) || null,
        mode: (a.mode as FocusSession['mode']) || 'work',
        duration_min: (a.durationMin as number) || 25,
        completed: (a.completed as boolean) || false,
        domain_slug: (a.domainSlug as string) || null,
      };
      const sessions = lsGet<FocusSession[]>(LS_FOCUS_KEY, []);
      sessions.unshift(fs);
      lsSet(LS_FOCUS_KEY, sessions);
      return fs as T;
    }

    default:
      console.warn(`[browser-mock] Unhandled command: ${cmd}`);
      return undefined as T;
  }
}

function buildDefaultAchievements(): Achievement[] {
  return [
    { id: 'first-session', title: 'First Steps', description: 'Complete your first session', icon: 'footprints', category: 'milestone', xp: 50, unlocked: false, unlocked_at: null, progress: 0, target: 1 },
    { id: 'streak-3', title: 'On a Roll', description: '3-day streak', icon: 'flame', category: 'streak', xp: 100, unlocked: false, unlocked_at: null, progress: 0, target: 3 },
    { id: 'streak-7', title: 'Week Warrior', description: '7-day streak', icon: 'flame', category: 'streak', xp: 250, unlocked: false, unlocked_at: null, progress: 0, target: 7 },
    { id: 'streak-30', title: 'Monthly Master', description: '30-day streak', icon: 'flame', category: 'streak', xp: 1000, unlocked: false, unlocked_at: null, progress: 0, target: 30 },
    { id: 'quiz-perfect', title: 'Perfect Score', description: 'Score 100% on a quiz', icon: 'star', category: 'mastery', xp: 200, unlocked: false, unlocked_at: null, progress: 0, target: 1 },
    { id: 'quiz-10', title: 'Quiz Veteran', description: 'Complete 10 quizzes', icon: 'brain', category: 'mastery', xp: 300, unlocked: false, unlocked_at: null, progress: 0, target: 10 },
    { id: 'notes-10', title: 'Prolific Writer', description: 'Write 10 notes', icon: 'pencil', category: 'milestone', xp: 150, unlocked: false, unlocked_at: null, progress: 0, target: 10 },
    { id: 'focus-5h', title: 'Deep Focus', description: 'Accumulate 5 hours of focus time', icon: 'timer', category: 'milestone', xp: 500, unlocked: false, unlocked_at: null, progress: 0, target: 300 },
    { id: 'all-domains', title: 'Renaissance Learner', description: 'Study all 4 domains', icon: 'globe', category: 'special', xp: 200, unlocked: false, unlocked_at: null, progress: 0, target: 4 },
    { id: 'flashcard-100', title: 'Card Shark', description: 'Review 100 flashcards', icon: 'layers', category: 'mastery', xp: 400, unlocked: false, unlocked_at: null, progress: 0, target: 100 },
    { id: 'milestone-25', title: 'Quarter Way', description: 'Complete 25% of the program', icon: 'flag', category: 'milestone', xp: 500, unlocked: false, unlocked_at: null, progress: 0, target: 54 },
    { id: 'milestone-50', title: 'Halfway There', description: 'Complete 50% of the program', icon: 'flag', category: 'milestone', xp: 1000, unlocked: false, unlocked_at: null, progress: 0, target: 108 },
  ];
}

// ── Unified Invoke ──────────────────────────────────────────────────────

let _showErrorToast: ((message: string) => void) | null = null;

export function registerToastHandler(handler: (message: string) => void): void {
  _showErrorToast = handler;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    // Use tauriInvoke if Tauri runtime is present, or if invoke is a test mock
    const hasTauri = typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    const isMock = typeof tauriInvoke === 'function' && ('_isMockFunction' in (tauriInvoke as object) || import.meta.env?.MODE === 'test');
    if ((hasTauri || isMock) && typeof tauriInvoke === 'function') {
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

// ── Notes Commands ─────────────────────────────────────────────────────

export async function listNotes(): Promise<Note[]> {
  return invoke('list_notes');
}

export async function createNote(title: string, content: string, tags: string[] = [], domainSlug?: string, topicSlug?: string, sessionId?: string): Promise<Note> {
  return invoke('create_note', { title, content, tags, domainSlug, topicSlug, sessionId });
}

export async function updateNote(noteId: string, updates: { title?: string; content?: string; tags?: string[]; pinned?: boolean }): Promise<Note> {
  return invoke('update_note', { noteId, ...updates });
}

export async function deleteNote(noteId: string): Promise<void> {
  return invoke('delete_note', { noteId });
}

// ── Flashcard Commands ─────────────────────────────────────────────────

export async function listFlashcards(): Promise<Flashcard[]> {
  return invoke('list_flashcards');
}

export async function getDueFlashcards(): Promise<Flashcard[]> {
  return invoke('get_due_flashcards');
}

export async function createFlashcard(front: string, back: string, domainSlug: string, topicSlug: string): Promise<Flashcard> {
  return invoke('create_flashcard', { front, back, domainSlug, topicSlug });
}

export async function reviewFlashcard(cardId: string, rating: FlashcardRating): Promise<Flashcard> {
  return invoke('review_flashcard', { cardId, rating });
}

// ── Achievement Commands ───────────────────────────────────────────────

export async function getAchievements(): Promise<Achievement[]> {
  return invoke('get_achievements');
}

export async function getXpState(): Promise<XpState> {
  return invoke('get_xp_state');
}

export async function awardXp(amount: number): Promise<XpState> {
  return invoke('award_xp', { amount });
}

export async function unlockAchievement(achievementId: string): Promise<void> {
  return invoke('unlock_achievement', { achievementId });
}

export async function updateStreak(streak: number): Promise<XpState> {
  return invoke('update_streak', { streak });
}

// ── Focus Timer Commands ───────────────────────────────────────────────

export async function listFocusSessions(): Promise<FocusSession[]> {
  return invoke('list_focus_sessions');
}

export async function saveFocusSession(session: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  return invoke('save_focus_session', session as Record<string, unknown>);
}
