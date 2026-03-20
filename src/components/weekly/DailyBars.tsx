import { Card } from '../shared';
import type { Session } from '../../types/models';

interface DailyBarsProps {
  sessions: Session[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function DailyBars({ sessions }: DailyBarsProps) {
  // Group sessions by day_of_week (1=Mon..5=Fri)
  const byDay = new Map<number, Session>();
  for (const s of sessions) {
    if (s.day_of_week >= 1 && s.day_of_week <= 5) {
      byDay.set(s.day_of_week, s);
    }
  }

  const maxMin = 60; // scale bar against 60 min

  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Daily Completion
      </h3>
      <div className="flex items-end gap-2 h-32">
        {DAY_LABELS.map((label, idx) => {
          const day = idx + 1;
          const session = byDay.get(day);
          const timeMin = session?.time_spent_min ?? 0;
          const isCompleted = session?.status === 'completed';
          const height = Math.min((timeMin / maxMin) * 100, 100);

          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    minHeight: timeMin > 0 ? '4px' : '0px',
                    background: isCompleted ? 'var(--accent-success)' : timeMin > 0 ? 'var(--accent-warning)' : 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)',
                  }}
                />
              </div>
              {timeMin > 0 && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
                >
                  {timeMin}m
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
