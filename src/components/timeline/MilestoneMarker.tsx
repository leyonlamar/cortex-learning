import { Diamond } from 'lucide-react';

interface MilestoneMarkerProps {
  label: string;
  percent: number;
  reached: boolean;
}

export function MilestoneMarker({ label, percent, reached }: MilestoneMarkerProps) {
  return (
    <div className="flex items-center gap-2">
      <Diamond
        size={16}
        style={{
          color: reached ? 'var(--accent-warning)' : 'var(--text-muted)',
          fill: reached ? 'var(--accent-warning)' : 'none',
        }}
        className={reached ? 'animate-bounce' : ''}
      />
      <span
        className="text-xs font-medium"
        style={{
          color: reached ? 'var(--accent-warning)' : 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {percent}% — {label}
      </span>
    </div>
  );
}
