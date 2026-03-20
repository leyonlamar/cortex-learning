import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  running: boolean;
}

export function QuizTimer({ running }: QuizTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  return (
    <div
      className="flex items-center gap-1 text-sm"
      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
    >
      <Clock size={14} />
      <span>{String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}</span>
    </div>
  );
}
