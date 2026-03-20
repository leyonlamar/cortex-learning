interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>
          Question {Math.min(current + 1, total)} of {total}
        </span>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: 'var(--accent-primary)', borderRadius: 'var(--border-radius)' }}
        />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full cursor-pointer"
            style={{
              background: i < current ? 'var(--accent-success)'
                : i === current ? 'var(--accent-primary)'
                : 'var(--bg-tertiary)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
