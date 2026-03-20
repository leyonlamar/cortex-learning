import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekSelectorProps {
  weekNum: number;
  totalWeeks: number;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekSelector({ weekNum, totalWeeks, onPrev, onNext }: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        disabled={weekNum <= 1}
        className="p-1 cursor-pointer border-none bg-transparent disabled:opacity-30"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Previous week"
      >
        <ChevronLeft size={18} />
      </button>
      <span
        className="text-sm font-semibold min-w-[60px] text-center"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        W{String(weekNum).padStart(2, '0')}
      </span>
      <button
        onClick={onNext}
        disabled={weekNum >= totalWeeks}
        className="p-1 cursor-pointer border-none bg-transparent disabled:opacity-30"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Next week"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
