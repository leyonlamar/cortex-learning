interface StatsBarProps {
  sessionsCompleted: number;
  totalHours: number;
  currentMastery: number;
}

export function StatsBar({ sessionsCompleted, totalHours, currentMastery }: StatsBarProps) {
  return (
    <div className="tk-stats-bar">
      <div className="tk-stat-card">
        <p className="tk-stat-label">Sessions Completed</p>
        <p className="tk-stat-value">{sessionsCompleted}</p>
      </div>
      <div className="tk-stat-card">
        <p className="tk-stat-label">Time Invested</p>
        <p className="tk-stat-value">
          {totalHours.toFixed(1)}
          <span className="tk-stat-unit">hrs</span>
        </p>
      </div>
      <div className="tk-stat-card">
        <p className="tk-stat-label">Current Mastery</p>
        <p className="tk-stat-value">
          {Math.round(currentMastery)}
          <span className="tk-stat-unit">%</span>
        </p>
      </div>
    </div>
  );
}
