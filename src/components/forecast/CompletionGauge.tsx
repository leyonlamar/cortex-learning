interface CompletionGaugeProps {
  probability: number; // 0-1
  size?: number;
}

export function CompletionGauge({ probability, size = 180 }: CompletionGaugeProps) {
  const pct = Math.round(probability * 100);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - probability * circumference;
  const center = size / 2;

  const color = pct >= 75 ? 'var(--accent-success)'
    : pct >= 50 ? 'var(--accent-warning)'
    : 'var(--accent-danger)';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-1000 ease-out"
        />
        {/* Center text */}
        <text
          x={center} y={center - 8}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-primary)"
          fontSize="28"
          fontFamily="var(--font-code)"
          fontWeight="bold"
        >
          {pct}%
        </text>
        <text
          x={center} y={center + 16}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          fontSize="11"
          fontFamily="var(--font-body)"
        >
          completion
        </text>
      </svg>
    </div>
  );
}
