import { Card } from '../shared';

interface DistributionChartProps {
  p10: number;
  p50: number;
  p90: number;
  label: string;
}

export function DistributionChart({ p10, p50, p90, label }: DistributionChartProps) {
  const min = Math.max(0, p10 - 10);
  const max = Math.min(100, p90 + 10);
  const range = max - min || 1;

  const toX = (v: number) => ((v - min) / range) * 100;

  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        {label}
      </h3>
      <div className="relative h-16">
        {/* Range bar */}
        <div
          className="absolute top-6 h-3"
          style={{
            left: `${toX(p10)}%`,
            width: `${toX(p90) - toX(p10)}%`,
            background: 'var(--accent-info)',
            opacity: 0.3,
            borderRadius: 'var(--border-radius)',
          }}
        />
        {/* Median marker */}
        <div
          className="absolute top-4 w-0.5 h-7"
          style={{
            left: `${toX(p50)}%`,
            background: 'var(--accent-primary)',
          }}
        />
        {/* Labels */}
        <div
          className="absolute top-0 text-xs"
          style={{
            left: `${toX(p10)}%`,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-code)',
            transform: 'translateX(-50%)',
          }}
        >
          p10: {Math.round(p10)}
        </div>
        <div
          className="absolute top-0 text-xs font-bold"
          style={{
            left: `${toX(p50)}%`,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-code)',
            transform: 'translateX(-50%)',
          }}
        >
          p50: {Math.round(p50)}
        </div>
        <div
          className="absolute top-0 text-xs"
          style={{
            left: `${toX(p90)}%`,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-code)',
            transform: 'translateX(-50%)',
          }}
        >
          p90: {Math.round(p90)}
        </div>
      </div>
    </Card>
  );
}
