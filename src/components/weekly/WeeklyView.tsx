import { useEffect, useState } from 'react';
import { WeekSelector } from './WeekSelector';
import { DailyBars } from './DailyBars';
import { MasteryChanges } from './MasteryChanges';
import { QuizCard } from './QuizCard';
import { useCalendar } from '../../hooks/useCalendar';
import { Spinner } from '../shared';

interface WeeklyViewProps {
  onNavigateToQuiz?: () => void;
}

export function WeeklyView({ onNavigateToQuiz }: WeeklyViewProps) {
  const { calendar, currentWeek, weekSessions, loading, loadCalendar, selectWeek } = useCalendar();
  const [weekIdx, setWeekIdx] = useState(0);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  // Auto-select first week with data once calendar loads
  useEffect(() => {
    if (!calendar || calendar.weeks.length === 0) return;
    // Find current week (first non-completed or last)
    const now = new Date().toISOString().slice(0, 10);
    let idx = calendar.weeks.findIndex((ws) => ws.week.end_date >= now);
    if (idx < 0) idx = calendar.weeks.length - 1;
    setWeekIdx(idx);
    selectWeek(calendar.weeks[idx].week.id);
  }, [calendar, selectWeek]);

  const totalWeeks = calendar?.weeks.length ?? 43;
  const weekNum = weekIdx + 1;

  const handlePrev = () => {
    if (!calendar || weekIdx <= 0) return;
    const newIdx = weekIdx - 1;
    setWeekIdx(newIdx);
    selectWeek(calendar.weeks[newIdx].week.id);
  };

  const handleNext = () => {
    if (!calendar || weekIdx >= totalWeeks - 1) return;
    const newIdx = weekIdx + 1;
    setWeekIdx(newIdx);
    selectWeek(calendar.weeks[newIdx].week.id);
  };

  if (loading && !calendar) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={24} />
      </div>
    );
  }

  const weekData = calendar?.weeks[weekIdx];
  const aggregate = weekData?.aggregate;
  const completedCount = weekSessions.filter((s) => s.status === 'completed').length;
  const totalCount = weekSessions.length;
  const quizScore = aggregate?.quiz_score;

  // Compute mastery deltas from session retrieval scores (delta from 0.7 baseline)
  const BASELINE = 0.7;
  const masteryDeltas = weekSessions
    .filter((s) => s.status === 'completed' && s.retrieval_score != null)
    .map((s) => ({
      topicName: `Session ${s.date.slice(5)}`,
      delta: (s.retrieval_score! / 100) - BASELINE,
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Week selector header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Weekly Review
        </h2>
        <WeekSelector
          weekNum={weekNum}
          totalWeeks={totalWeeks}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>

      {/* Week objective */}
      {currentWeek?.objective && (
        <div
          className="text-sm px-3 py-2"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
          }}
        >
          {currentWeek.objective}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <DailyBars sessions={weekSessions} />
          <MasteryChanges deltas={masteryDeltas} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <QuizCard
            quizStatus={quizScore != null ? 'completed' : 'pending'}
            score={quizScore ?? null}
            topicCount={totalCount}
            onLaunch={() => onNavigateToQuiz?.()}
          />

          {/* Week summary */}
          <div
            className="p-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            <h3
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Week Summary
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Sessions</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Hours</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                  {aggregate?.total_hours != null ? `${aggregate.total_hours.toFixed(1)}h` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Attendance</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                  {aggregate?.attendance_rate != null ? `${Math.round(aggregate.attendance_rate * 100)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Quiz Score</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                  {quizScore != null ? `${Math.round(quizScore)}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
