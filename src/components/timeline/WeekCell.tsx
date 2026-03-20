interface WeekCellProps {
  weekNum: number;
  attendanceRate: number;
  quizScore: number | null;
  isCurrent: boolean;
  onClick: () => void;
}

export function WeekCell({ weekNum, attendanceRate, quizScore, isCurrent, onClick }: WeekCellProps) {
  // Heatmap intensity based on attendance
  const intensity = Math.min(attendanceRate / 100, 1);
  const bgOpacity = 0.1 + intensity * 0.6;

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full aspect-square cursor-pointer border-none ${isCurrent ? 'animate-pulse' : ''}`}
      style={{
        background: `rgba(var(--accent-primary-rgb, 0, 0, 0), ${bgOpacity})`,
        backgroundColor: intensity > 0 ? 'var(--accent-success)' : 'var(--bg-tertiary)',
        opacity: intensity > 0 ? 0.3 + intensity * 0.7 : 0.3,
        borderRadius: 'var(--border-radius)',
        border: isCurrent ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
      }}
      title={`W${String(weekNum).padStart(2, '0')} — ${Math.round(attendanceRate)}% attendance${quizScore !== null ? `, quiz: ${Math.round(quizScore)}%` : ''}`}
    >
      <span
        className="text-xs font-medium"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}
      >
        {String(weekNum).padStart(2, '0')}
      </span>
      {quizScore !== null && (
        <div
          className="absolute -top-1 -right-1 rounded-full"
          style={{
            width: `${6 + (quizScore / 100) * 8}px`,
            height: `${6 + (quizScore / 100) * 8}px`,
            background: 'var(--accent-info)',
          }}
        />
      )}
    </button>
  );
}
