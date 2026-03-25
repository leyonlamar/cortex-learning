import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { WeekWithSessions } from '../../types/models';
import { DayCard } from './DayCard';

interface WeekBlockProps {
  weekData: WeekWithSessions;
  forceOpen?: boolean;
  onSessionUpdate?: () => void;
}

function getWeekStatus(weekData: WeekWithSessions): 'done' | 'current' | 'future' {
  const { sessions } = weekData;
  const now = new Date();
  const start = new Date(weekData.week.start_date + 'T00:00:00');
  const end = new Date(weekData.week.end_date + 'T23:59:59');

  if (now >= start && now <= end) return 'current';

  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  if (completedCount === sessions.length && sessions.length > 0) return 'done';
  if (now > end) return 'done'; // past week

  return 'future';
}

export function WeekBlock({ weekData, forceOpen, onSessionUpdate }: WeekBlockProps) {
  const status = getWeekStatus(weekData);
  const [open, setOpen] = useState(forceOpen ?? status === 'current');

  const { week, sessions } = weekData;
  const completed = sessions.filter((s) => s.status === 'completed').length;
  const total = sessions.length;

  return (
    <div className="tk-week">
      <button
        className="tk-week-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className={`tk-week-accent ${status}`} />
        <span className="tk-week-label">
          W{week.week_num}
          {week.objective && <span>: {week.objective}</span>}
        </span>
        <span className="tk-week-completion">{completed}/{total}</span>
        <ChevronDown size={16} className={`tk-week-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="tk-week-body">
          {sessions.map((session, idx) => (
            <DayCard
              key={session.id}
              session={session}
              dayIndex={idx + 1}
              onSessionUpdate={onSessionUpdate}
            />
          ))}
          {sessions.length === 0 && (
            <p style={{ color: 'var(--tk-text-muted)', fontSize: '0.8rem', padding: '8px 0' }}>
              No sessions scheduled for this week.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
