import { useState } from 'react';
import { Lock, Unlock, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Button, CompletionAnimation } from '../shared';
import type { PhaseKey } from '../../hooks/useSession';
import type { Theme } from '../../types/models';

function readTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  const valid: Theme[] = ['glass', 'executive', 'brutalist', 'console', 'cyberpunk', 'luxury', 'nasa', 'studyhall'];
  return valid.includes(attr as Theme) ? (attr as Theme) : 'glass';
}

interface PhaseCardProps {
  phase: PhaseKey;
  index: number;
  unlocked: boolean;
  completed: boolean;
  isCurrent: boolean;
  onComplete: (durationMin: number, content: string | null, score: number | null) => void;
  children?: React.ReactNode;
}

const PHASE_META: Record<PhaseKey, { label: string; icon: string; defaultMin: number; color: string }> = {
  retrieval: { label: 'Retrieval Practice', icon: '\u{1F9E0}', defaultMin: 5, color: 'var(--chart-1)' },
  learning: { label: 'New Learning', icon: '\u{1F4D6}', defaultMin: 25, color: 'var(--chart-2)' },
  micro_task: { label: 'Micro-Task', icon: '\u{1F3AF}', defaultMin: 12, color: 'var(--chart-3)' },
  reflection: { label: 'Reflection', icon: '\u{1F4AD}', defaultMin: 5, color: 'var(--chart-4)' },
};

export function PhaseCard({ phase, index, unlocked, completed, isCurrent, onComplete, children }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(isCurrent);
  const [showAnimation, setShowAnimation] = useState(false);
  const meta = PHASE_META[phase];

  const handleComplete = () => {
    setShowAnimation(true);
    onComplete(meta.defaultMin, null, null);
  };

  return (
    <>
      <CompletionAnimation
        active={showAnimation}
        theme={readTheme()}
        type="phase"
        onDismiss={() => setShowAnimation(false)}
      />
    <Card
      className={`transition-all duration-200 ${!unlocked ? 'opacity-40' : ''}`}
      glow={isCurrent}
      style={{
        borderLeft: isCurrent
          ? `3px solid ${meta.color}`
          : completed
            ? '3px solid var(--accent-success)'
            : undefined,
      }}
    >
      <button
        className="flex items-center justify-between w-full cursor-pointer border-none bg-transparent p-0"
        onClick={() => unlocked && setExpanded((e) => !e)}
        disabled={!unlocked}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{meta.icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', letterSpacing: '0.04em' }}
              >
                Phase {index + 1}
              </span>
              {completed && (
                <div className="flex items-center gap-1">
                  <Check size={12} style={{ color: 'var(--accent-success)' }} />
                  <span className="text-xs" style={{ color: 'var(--accent-success)' }}>done</span>
                </div>
              )}
            </div>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              {meta.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs tabular-nums"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
          >
            {meta.defaultMin}m
          </span>
          {unlocked ? (
            completed ? null : expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <Lock size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </button>

      {expanded && unlocked && !completed && (
        <div className="mt-4 pt-4 animate-accordion" style={{ borderTop: '1px solid var(--border-color)' }}>
          {children || (
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {phase === 'retrieval' && 'Test your recall on previously studied topics before looking at any material.'}
              {phase === 'learning' && 'Engage with new material for your scheduled topics today.'}
              {phase === 'micro_task' && 'Complete a focused practice task applying what you learned.'}
              {phase === 'reflection' && 'Rate your confidence and energy, and capture any notes.'}
            </p>
          )}
          <Button size="sm" onClick={handleComplete}>
            <Unlock size={14} />
            Complete Phase
          </Button>
        </div>
      )}
    </Card>
    </>
  );
}
