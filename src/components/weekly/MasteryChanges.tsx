import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../shared';

interface MasteryDelta {
  topicName: string;
  delta: number;
}

interface MasteryChangesProps {
  deltas: MasteryDelta[];
}

export function MasteryChanges({ deltas }: MasteryChangesProps) {
  const sorted = [...deltas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Mastery Changes
      </h3>
      {sorted.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No mastery data this week yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((item) => {
            const Icon = item.delta > 0.01 ? TrendingUp : item.delta < -0.01 ? TrendingDown : Minus;
            const color = item.delta > 0.01 ? 'var(--accent-success)' : item.delta < -0.01 ? 'var(--accent-danger)' : 'var(--text-muted)';
            return (
              <li key={item.topicName} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-primary)' }}>{item.topicName}</span>
                <div className="flex items-center gap-1" style={{ color }}>
                  <Icon size={14} />
                  <span style={{ fontFamily: 'var(--font-code)' }}>
                    {item.delta >= 0 ? '+' : ''}{(item.delta * 100).toFixed(1)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
