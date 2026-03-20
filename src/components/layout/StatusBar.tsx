interface StatusBarProps {
  weekLabel: string;
  dayLabel: string;
  attendanceRate: number;
  nextQuizLabel: string | null;
}

export function StatusBar({ weekLabel, dayLabel, attendanceRate, nextQuizLabel }: StatusBarProps) {
  return (
    <footer
      className="flex items-center justify-between px-4 text-xs shrink-0"
      style={{
        height: 'var(--status-bar-height)',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-code)',
        letterSpacing: '0.02em',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Live pulse */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full pulse-dot"
            style={{ background: 'var(--accent-success)' }}
          />
          <span>{weekLabel}</span>
        </div>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{dayLabel}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{Math.round(attendanceRate)}% att.</span>
        {nextQuizLabel && (
          <>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>quiz {nextQuizLabel}</span>
          </>
        )}
      </div>
    </footer>
  );
}
