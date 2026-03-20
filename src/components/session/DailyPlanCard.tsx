import { Card } from '../shared';
import type { DailyPlan } from '../../types/models';

interface DailyPlanCardProps {
  plan: DailyPlan | null;
}

export function DailyPlanCard({ plan }: DailyPlanCardProps) {
  if (!plan) {
    return (
      <Card className="opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--text-muted)' }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            Today's Plan
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} className="text-sm">
          No daily plan available yet. Complete a few sessions to get RL-powered recommendations.
        </p>
      </Card>
    );
  }

  const { time_allocation: ta, emphasis, rationale } = plan;

  const segments = [
    { label: 'Retrieval', min: ta.retrieval_min, color: 'var(--chart-1)' },
    { label: 'New Learning', min: ta.new_learning_min, color: 'var(--chart-2)' },
    { label: 'Micro-Task', min: ta.micro_task_min, color: 'var(--chart-3)' },
    { label: 'Reflection', min: ta.reflection_min, color: 'var(--chart-4)' },
  ];

  const totalMin = segments.reduce((sum, s) => sum + s.min, 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full pulse-dot"
            style={{ background: 'var(--accent-primary)' }}
          />
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
          >
            Today's Plan
          </h3>
        </div>
        <span
          className="px-2.5 py-0.5 text-xs font-medium"
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            borderRadius: '9999px',
          }}
        >
          {emphasis.replace('_', ' ')}
        </span>
      </div>

      {/* Time allocation bar */}
      <div
        className="flex h-2 overflow-hidden mb-3"
        style={{ borderRadius: 'var(--border-radius)', gap: '2px' }}
      >
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="animate-fill"
            style={{
              width: `${(seg.min / totalMin) * 100}%`,
              background: seg.color,
              borderRadius: '1px',
              animationDelay: `${segments.indexOf(seg) * 100}ms`,
            }}
            title={`${seg.label}: ${seg.min} min`}
          />
        ))}
      </div>

      {/* Time breakdown */}
      <div className="flex gap-4 mb-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-sm" style={{ background: seg.color }} />
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-code)' }}>
              {seg.min}m
            </span>
          </div>
        ))}
      </div>

      {/* Rationale */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
      >
        {rationale}
      </p>
    </Card>
  );
}
