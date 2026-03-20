import { useEffect } from 'react';
import { MonthRow } from './MonthRow';
import { MilestoneMarker } from './MilestoneMarker';
import { Card, Spinner } from '../shared';
import { useCalendar } from '../../hooks/useCalendar';
import type { Calendar } from '../../types/models';

interface TimelineViewProps {
  onWeekClick?: (weekNum: number) => void;
}

// Map week numbers to months (Mar-Dec 2026)
const MONTH_RANGES: { month: string; startWeek: number; endWeek: number }[] = [
  { month: 'March', startWeek: 1, endWeek: 4 },
  { month: 'April', startWeek: 5, endWeek: 9 },
  { month: 'May', startWeek: 10, endWeek: 13 },
  { month: 'June', startWeek: 14, endWeek: 17 },
  { month: 'July', startWeek: 18, endWeek: 22 },
  { month: 'August', startWeek: 23, endWeek: 26 },
  { month: 'September', startWeek: 27, endWeek: 31 },
  { month: 'October', startWeek: 32, endWeek: 35 },
  { month: 'November', startWeek: 36, endWeek: 39 },
  { month: 'December', startWeek: 40, endWeek: 43 },
];

const MILESTONES = [
  { label: 'Quarter Start', percent: 25 },
  { label: 'Halfway', percent: 50 },
  { label: 'Home Stretch', percent: 75 },
  { label: 'Complete', percent: 100 },
];

function deriveCurrentWeekNum(cal: Calendar | null): number {
  if (!cal || cal.weeks.length === 0) return 1;
  const today = new Date().toISOString().slice(0, 10);
  const idx = cal.weeks.findIndex((ws) => ws.week.start_date <= today && ws.week.end_date >= today);
  if (idx >= 0) return cal.weeks[idx].week.week_num;
  // If before start, return 1; if after end, return last
  if (today < cal.weeks[0].week.start_date) return 1;
  return cal.weeks[cal.weeks.length - 1].week.week_num;
}

export function TimelineView({ onWeekClick }: TimelineViewProps) {
  const { calendar, loading, loadCalendar } = useCalendar();

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  if (loading && !calendar) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={24} />
      </div>
    );
  }

  const totalSessions = calendar?.total_sessions ?? 215;
  const completedSessions = calendar?.completed_sessions ?? 0;
  const currentProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  const currentWeekNum = deriveCurrentWeekNum(calendar);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Timeline — Mar to Dec 2026
        </h2>
        <span
          className="text-sm"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
        >
          {completedSessions}/{totalSessions} sessions
        </span>
      </div>

      {/* Milestones */}
      <Card>
        <div className="flex flex-wrap gap-4">
          {MILESTONES.map((m) => (
            <MilestoneMarker
              key={m.percent}
              label={m.label}
              percent={m.percent}
              reached={currentProgress >= m.percent}
            />
          ))}
        </div>
      </Card>

      {/* Month grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MONTH_RANGES.map((mr) => {
          const weeks = [];
          for (let w = mr.startWeek; w <= mr.endWeek; w++) {
            const weekData = calendar?.weeks.find((wk) => wk.week.week_num === w);
            weeks.push({
              weekNum: w,
              attendanceRate: weekData?.aggregate?.attendance_rate ?? 0,
              quizScore: weekData?.aggregate?.quiz_score ?? null,
            });
          }
          return (
            <MonthRow
              key={mr.month}
              month={mr.month}
              weeks={weeks}
              currentWeekNum={currentWeekNum}
              onWeekClick={(wn) => onWeekClick?.(wn)}
            />
          );
        })}
      </div>
    </div>
  );
}
