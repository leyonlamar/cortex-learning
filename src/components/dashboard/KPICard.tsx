import { Card } from '../shared';

interface KPICardProps {
  label: string;
  value: string;
  delta: string | null;
  deltaPositive: boolean;
  sparkData?: number[];
}

export function KPICard({ label, value, delta, deltaPositive, sparkData }: KPICardProps) {
  const sparkMax = sparkData ? Math.max(...sparkData, 1) : 1;

  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
      <div className="flex items-end justify-between">
        <span
          className="text-2xl font-bold"
          data-value
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}
        >
          {value}
        </span>
        {delta && (
          <span
            className="text-xs font-medium"
            style={{
              color: deltaPositive ? 'var(--accent-success)' : 'var(--accent-danger)',
              fontFamily: 'var(--font-code)',
            }}
          >
            {delta}
          </span>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <svg viewBox={`0 0 ${sparkData.length * 10} 24`} className="w-full h-6">
          <polyline
            points={sparkData.map((v, i) => `${i * 10},${24 - (v / sparkMax) * 20}`).join(' ')}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </Card>
  );
}
