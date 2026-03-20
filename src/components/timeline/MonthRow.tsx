import { WeekCell } from './WeekCell';

interface WeekData {
  weekNum: number;
  attendanceRate: number;
  quizScore: number | null;
}

interface MonthRowProps {
  month: string;
  weeks: WeekData[];
  currentWeekNum: number;
  onWeekClick: (weekNum: number) => void;
}

export function MonthRow({ month, weeks, currentWeekNum, onWeekClick }: MonthRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
      >
        {month}
      </span>
      <div className="grid grid-cols-5 gap-2">
        {weeks.map((w) => (
          <WeekCell
            key={w.weekNum}
            weekNum={w.weekNum}
            attendanceRate={w.attendanceRate}
            quizScore={w.quizScore}
            isCurrent={w.weekNum === currentWeekNum}
            onClick={() => onWeekClick(w.weekNum)}
          />
        ))}
      </div>
    </div>
  );
}
