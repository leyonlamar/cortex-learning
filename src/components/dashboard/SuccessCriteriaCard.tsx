import { Check, X, Minus } from 'lucide-react';
import { Card } from '../shared';

interface Criterion {
  label: string;
  current: string;
  target: string;
  met: boolean | null; // null = in progress
}

interface SuccessCriteriaCardProps {
  criteria: Criterion[];
}

const DEFAULT_CRITERIA: Criterion[] = [
  { label: 'Attendance Rate', current: '0%', target: '≥90%', met: null },
  { label: 'Quiz Average', current: '0%', target: '≥80%', met: null },
  { label: 'Hours Logged', current: '0h', target: '430h', met: null },
  { label: 'Mastery Coverage', current: '0%', target: '≥70%', met: null },
  { label: 'Streak (best)', current: '0d', target: '≥20d', met: null },
  { label: 'Domain Balance', current: '0/6', target: '6/6', met: null },
  { label: 'Forecast Confidence', current: '0%', target: '≥75%', met: null },
];

export function SuccessCriteriaCard({ criteria = DEFAULT_CRITERIA }: SuccessCriteriaCardProps) {
  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Success Criteria
      </h3>
      <div className="flex flex-col gap-2">
        {criteria.map((c) => (
          <div key={c.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {c.met === true && <Check size={12} style={{ color: 'var(--accent-success)' }} />}
              {c.met === false && <X size={12} style={{ color: 'var(--accent-danger)' }} />}
              {c.met === null && <Minus size={12} style={{ color: 'var(--text-muted)' }} />}
              <span style={{ color: 'var(--text-primary)' }}>{c.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                {c.current}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-code)' }}>
                {c.target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
