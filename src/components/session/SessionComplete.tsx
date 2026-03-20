import { useState } from 'react';
import { Card, Button, CompletionAnimation } from '../shared';
import type { Theme } from '../../types/models';

interface SessionCompleteProps {
  sessionId: string;
  totalPhases: number;
  onSubmit: (
    timeSpentMin: number,
    retrievalScore: number,
    confidence: number,
    energyLevel: number,
    notes: string | null,
  ) => void;
}

function readTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  const valid: Theme[] = ['glass', 'executive', 'brutalist', 'console', 'cyberpunk', 'luxury', 'nasa', 'studyhall'];
  return valid.includes(attr as Theme) ? (attr as Theme) : 'glass';
}

export function SessionComplete({ sessionId: _sessionId, totalPhases, onSubmit }: SessionCompleteProps) {
  const [confidence, setConfidence] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setShowAnimation(true);
    // Estimate time and retrieval score from phase data
    onSubmit(
      47, // approximate total min
      0.7, // placeholder retrieval score
      confidence,
      energy,
      notes.trim() || null,
    );
  };

  if (submitted) {
    return (
      <>
        <CompletionAnimation
          active={showAnimation}
          theme={readTheme()}
          type="session"
          onDismiss={() => setShowAnimation(false)}
        />
        <Card className="text-center py-8">
          <div className="text-4xl mb-4" aria-hidden>
            ✨
          </div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Session Complete!
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            All {totalPhases} phases finished. Great work today.
          </p>
        </Card>
      </>
    );
  }

  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-4"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Wrap Up Session
      </h3>

      {/* Confidence slider */}
      <div className="mb-4">
        <label className="flex items-center justify-between text-sm mb-1">
          <span style={{ color: 'var(--text-secondary)' }}>Confidence</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>{confidence}/5</span>
        </label>
        <input
          type="range"
          min={1} max={5} step={1}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--accent-primary)' }}
        />
      </div>

      {/* Energy slider */}
      <div className="mb-4">
        <label className="flex items-center justify-between text-sm mb-1">
          <span style={{ color: 'var(--text-secondary)' }}>Energy Level</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>{energy}/5</span>
        </label>
        <input
          type="range"
          min={1} max={5} step={1}
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--accent-primary)' }}
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            resize: 'vertical',
          }}
          placeholder="How did the session go?"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        Complete Session
      </Button>
    </Card>
  );
}
