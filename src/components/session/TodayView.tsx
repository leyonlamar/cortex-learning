import { useEffect, useState } from 'react';
import { useSession } from '../../hooks/useSession';
import { useCalendar } from '../../hooks/useCalendar';
import { getAllTopics, getReviewStats, rescheduleMissed } from '../../lib/tauri-bridge';
import { DailyPlanCard } from './DailyPlanCard';
import { PhaseCard } from './PhaseCard';
import { ReviewQueue } from './ReviewQueue';
import { QuickStats } from './QuickStats';
import { SessionComplete } from './SessionComplete';
import { Spinner } from '../shared';
import type { Topic } from '../../types/models';

interface ReviewItem {
  topicId: string;
  topicName: string;
  domainSlug: string;
  recallProbability: number;
}

function CatchUpButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  async function handleCatchUp() {
    setBusy(true);
    try {
      const count = await rescheduleMissed();
      setResult(count);
    } finally {
      setBusy(false);
    }
  }

  if (result !== null) {
    return (
      <p className="text-sm" style={{ color: 'var(--accent-primary)' }}>
        {result === 0
          ? 'No missed sessions to reschedule.'
          : `${result} session${result !== 1 ? 's' : ''} rescheduled.`}
      </p>
    );
  }

  return (
    <button
      onClick={handleCatchUp}
      disabled={busy}
      className="px-4 py-2 text-sm rounded"
      style={{
        background: 'var(--accent-primary)',
        color: 'var(--bg-primary)',
        opacity: busy ? 0.6 : 1,
        cursor: busy ? 'not-allowed' : 'pointer',
        border: 'none',
      }}
    >
      {busy ? 'Rescheduling…' : 'Catch Up — Reschedule Missed Sessions'}
    </button>
  );
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 5) return '\u{1F319}';
  if (hour < 12) return '\u{2600}\u{FE0F}';
  if (hour < 17) return '\u{26C5}';
  if (hour < 21) return '\u{1F305}';
  return '\u{1F319}';
}

interface TodayViewProps {
  onNavigateToQuiz?: () => void;
}

export function TodayView({ onNavigateToQuiz: _onNavigateToQuiz }: TodayViewProps) {
  const {
    session, dailyPlan, currentPhase, completedPhases,
    loading, loadToday, loadDailyPlan, finishPhase, finishSession,
    isPhaseUnlocked, phaseOrder,
  } = useSession();
  const { calendar, loadCalendar } = useCalendar();
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    loadToday();
    loadCalendar();
  }, [loadToday, loadCalendar]);

  // Ctrl/Cmd + Enter: complete the current unlocked, incomplete phase
  useEffect(() => {
    function handleCompletePhase() {
      if (!session) return;
      // Find the first phase that is unlocked and not yet completed
      const targetPhase = phaseOrder.find(
        (p, idx) => !completedPhases.has(p) && (idx === 0 || completedPhases.has(phaseOrder[idx - 1]))
      );
      if (targetPhase) {
        finishPhase(session.id, targetPhase, 0, null, null);
      }
    }
    window.addEventListener('learning-os:complete-phase', handleCompletePhase);
    return () => window.removeEventListener('learning-os:complete-phase', handleCompletePhase);
  }, [session, phaseOrder, completedPhases, finishPhase]);

  // Load topics → daily plan + review queue
  useEffect(() => {
    let cancelled = false;
    async function loadTopicData() {
      try {
        const topics: Topic[] = await getAllTopics();
        if (cancelled || topics.length === 0) return;

        // Load daily plan with topic IDs
        const topicIds = topics.map((t) => t.id);
        loadDailyPlan(topicIds);

        // Get real spaced_rep data with computed recall probabilities
        const topicMap = new Map(topics.map((t) => [t.id, t]));
        try {
          const stats = await getReviewStats();
          const items: ReviewItem[] = stats
            .map((s) => {
              const topic = topicMap.get(s.topic_id);
              return {
                topicId: s.topic_id,
                topicName: topic?.name ?? s.topic_id,
                domainSlug: topic?.slug ?? '',
                recallProbability: s.recall_probability,
              };
            })
            .sort((a, b) => a.recallProbability - b.recallProbability);
          if (!cancelled) setReviewItems(items);
        } catch {
          // No spaced_rep data yet — show topics with default recall
          const items: ReviewItem[] = topics.slice(0, 10).map((t) => ({
            topicId: t.id,
            topicName: t.name,
            domainSlug: t.slug,
            recallProbability: 0.5,
          }));
          if (!cancelled) setReviewItems(items);
        }
      } catch {
        // topics not seeded yet — that's fine
      }
    }
    loadTopicData();
    return () => { cancelled = true; };
  }, [loadDailyPlan]);

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <Spinner size={32} />
      </div>
    );
  }

  // No session for today — show contextual message based on date
  if (!loading && !session) {
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay(); // 0=Sun, 6=Sat

    // Derive program end from calendar data
    const programEnd = calendar?.weeks[calendar.weeks.length - 1]?.week.end_date;

    let noSessionMessage: string;
    let noSessionSub: string | null = null;
    let showCatchUp = false;

    if (programEnd && todayDate.toISOString().slice(0, 10) > programEnd) {
      noSessionMessage = "Congratulations! You've completed the 43-week program";
      noSessionSub = 'Your learning journey is archived below.';
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      noSessionMessage = 'Enjoy your weekend!';
      noSessionSub = 'Sessions resume Monday.';
    } else {
      noSessionMessage = 'No session scheduled for today.';
      showCatchUp = true;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div
            className="text-center py-16 animate-fade-in flex flex-col items-center gap-3"
          >
            <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
              {noSessionMessage}
            </p>
            {noSessionSub && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {noSessionSub}
              </p>
            )}
            {showCatchUp && <CatchUpButton />}
          </div>
        </div>
        <div className="flex flex-col gap-4 stagger-children" style={{ animationDelay: '200ms' }}>
          <QuickStats streak={0} weekProgress={0} masteryDelta={0} energyAvg={3} />
          <ReviewQueue items={reviewItems} />
        </div>
      </div>
    );
  }

  const allPhasesComplete = phaseOrder.every((p) => completedPhases.has(p));
  const isSessionDone = session?.status === 'completed';
  const completedCount = phaseOrder.filter((p) => completedPhases.has(p)).length;

  // Count missed sessions for catch-up banner
  const missedCount = calendar
    ? calendar.weeks.flatMap((ws) => ws.sessions).filter((s) => s.status === 'missed').length
    : 0;

  // Find current week progress
  const now = new Date().toISOString().slice(0, 10);
  const currentWeekData = calendar?.weeks.find((ws) => ws.week.start_date <= now && ws.week.end_date >= now);
  const weekProgress = currentWeekData?.aggregate?.attendance_rate
    ? currentWeekData.aggregate.attendance_rate * 100
    : 0;

  // Estimate streak from consecutive completed sessions
  let streak = 0;
  if (calendar) {
    const allSessions = calendar.weeks.flatMap((ws) => ws.sessions);
    const sorted = [...allSessions]
      .filter((s) => s.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < sorted.length; i++) {
      const sessionDate = new Date(sorted[i].date);
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (sessionDate.toISOString().slice(0, 10) === expected.toISOString().slice(0, 10)) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Mastery delta: use aggregate if available, else derive from retrieval scores
  const masteryDelta = currentWeekData?.aggregate?.mastery_delta ?? (() => {
    const scores = (currentWeekData?.sessions ?? [])
      .filter((s) => s.status === 'completed' && s.retrieval_score != null)
      .map((s) => s.retrieval_score!);
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return (avg / 100) - 0.7; // delta from 70% baseline
  })();

  // Energy average from completed sessions this week
  const weekSessions = currentWeekData?.sessions ?? [];
  const energyValues = weekSessions
    .filter((s) => s.energy_level != null)
    .map((s) => s.energy_level!);
  const energyAvg = energyValues.length > 0
    ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length
    : 3;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main column */}
      <div className="lg:col-span-2 flex flex-col gap-4 stagger-children">
        {/* Progress summary line */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getGreetingEmoji()}</span>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', letterSpacing: '0.04em' }}
            >
              {completedCount}/{phaseOrder.length} phases
            </span>
          </div>
          {/* Mini progress bar */}
          <div
            className="h-1 flex-1 mx-4 overflow-hidden"
            style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)', maxWidth: '200px' }}
          >
            <div
              className="h-full animate-fill"
              style={{
                width: `${phaseOrder.length > 0 ? (completedCount / phaseOrder.length) * 100 : 0}%`,
                background: 'var(--accent-primary)',
                borderRadius: 'var(--border-radius)',
              }}
            />
          </div>
        </div>

        {missedCount > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3 rounded animate-fade-in"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {missedCount} missed session{missedCount !== 1 ? 's' : ''}
            </span>
            <CatchUpButton />
          </div>
        )}

        {new Date().getDay() === 5 && (
          <div
            className="flex items-center justify-between gap-4 px-4 py-3 animate-fade-in"
            style={{
              background: 'var(--accent-primary)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--bg-primary)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">&#x1F4DD;</span>
              <div>
                <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  Friday Quiz Day
                </div>
                <div className="text-xs opacity-80">
                  Test your knowledge before the week ends
                </div>
              </div>
            </div>
            <button
              onClick={_onNavigateToQuiz}
              className="text-xs font-semibold px-3 py-1.5 border-none cursor-pointer"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--accent-primary)',
                borderRadius: 'var(--border-radius)',
                fontFamily: 'var(--font-code)',
              }}
            >
              Take Quiz
            </button>
          </div>
        )}

        <DailyPlanCard plan={dailyPlan} />

        {phaseOrder.map((phase, idx) => (
          <PhaseCard
            key={phase}
            phase={phase}
            index={idx}
            unlocked={isPhaseUnlocked(phase)}
            completed={completedPhases.has(phase)}
            isCurrent={currentPhase === phase && !completedPhases.has(phase)}
            onComplete={(dur, content, score) => {
              if (session) finishPhase(session.id, phase, dur, content, score);
            }}
          />
        ))}

        {allPhasesComplete && !isSessionDone && session && (
          <SessionComplete
            sessionId={session.id}
            totalPhases={phaseOrder.length}
            onSubmit={(time, retrieval, conf, energy, notes) => {
              finishSession(session.id, time, retrieval, conf, energy, notes);
            }}
          />
        )}

        {isSessionDone && (
          <div
            className="text-center py-8 text-sm animate-fade-up"
            style={{ color: 'var(--text-muted)' }}
          >
            Today's session is complete. See you tomorrow!
          </div>
        )}
      </div>

      {/* Sidebar column */}
      <div className="flex flex-col gap-4 stagger-children" style={{ animationDelay: '200ms' }}>
        <QuickStats
          streak={streak}
          weekProgress={weekProgress}
          masteryDelta={masteryDelta}
          energyAvg={energyAvg}
        />
        <ReviewQueue items={reviewItems} />
      </div>
    </div>
  );
}
