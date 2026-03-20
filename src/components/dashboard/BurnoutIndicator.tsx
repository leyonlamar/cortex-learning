import { Card } from '../shared';

interface BurnoutIndicatorProps {
  severity: number; // 0-5
}

export function BurnoutIndicator({ severity }: BurnoutIndicatorProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(severity)));
  const labels = ['None', 'Low', 'Mild', 'Moderate', 'High', 'Critical'];
  const colors = [
    'var(--accent-success)',
    'var(--accent-success)',
    'var(--accent-warning)',
    'var(--accent-warning)',
    'var(--accent-danger)',
    'var(--accent-danger)',
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Burnout Risk
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: colors[clamped], fontFamily: 'var(--font-code)' }}
        >
          {labels[clamped]}
        </span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full"
            style={{
              background: i < clamped ? colors[clamped] : 'var(--bg-tertiary)',
            }}
          />
        ))}
      </div>
    </Card>
  );
}
