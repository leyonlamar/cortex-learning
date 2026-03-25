interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="tk-progress-track">
      <div
        className="tk-progress-fill"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
