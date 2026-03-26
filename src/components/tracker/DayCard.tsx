import { useState, useCallback } from 'react';
import { ChevronDown, Check, Clock } from 'lucide-react';
import type { Session, SessionPhase } from '../../types/models';
import { getSessionPhases, completePhase, completeSession, uncompleteSession } from '../../lib/tauri-bridge';
import { allLessons } from '../../data/curriculum';

interface DayCardProps {
  session: Session;
  dayIndex: number;
  onSessionUpdate?: () => void;
}

const PHASE_META: Record<string, { label: string; defaultMin: number }> = {
  retrieval: { label: 'Retrieval Practice', defaultMin: 5 },
  learning: { label: 'New Learning', defaultMin: 12 },
  micro_task: { label: 'Micro-Task', defaultMin: 8 },
  reflection: { label: 'Reflection', defaultMin: 5 },
};

const PHASE_ORDER = ['retrieval', 'learning', 'micro_task', 'reflection'] as const;

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function DayCard({ session, dayIndex, onSessionUpdate }: DayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [phases, setPhases] = useState<SessionPhase[]>([]);
  const [phasesLoaded, setPhasesLoaded] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const lesson = allLessons[dayIndex - 1] ?? null;
  const [notes, setNotes] = useState(session.notes ?? '');
  const [confidence, setConfidence] = useState(session.confidence ?? 5);
  const [energy, setEnergy] = useState(session.energy_level ?? 5);

  const isComplete = session.status === 'completed';

  const loadPhases = useCallback(async () => {
    if (phasesLoaded) return;
    try {
      const p = await getSessionPhases(session.id);
      setPhases(p);
      setPhasesLoaded(true);
    } catch {
      // silently fail
    }
  }, [session.id, phasesLoaded]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadPhases();
  };

  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isComplete) {
        await uncompleteSession(session.id);
      } else {
        const totalMin = session.time_spent_min ?? 30;
        await completeSession(session.id, totalMin, 7, confidence, energy, notes || null);
      }
      onSessionUpdate?.();
    } catch {
      // toast handler will catch
    }
  };

  const handlePhaseToggle = async (phaseKey: string, idx: number) => {
    const alreadyDone = phases.some((p) => p.phase === phaseKey);
    if (alreadyDone) return;
    try {
      const meta = PHASE_META[phaseKey];
      await completePhase(session.id, phaseKey, meta?.defaultMin ?? 5, null, null, idx);
      const updated = await getSessionPhases(session.id);
      setPhases(updated);
    } catch {
      // toast handler
    }
  };

  const completedPhaseKeys = new Set(phases.map((p) => p.phase));
  const DOMAIN_COLORS: Record<string, string> = {
    'power-bi': '#F2C811',
    'business-intelligence': '#7C6BF0',
    'bi': '#7C6BF0',
    'operations': '#FF6B6B',
    'logistics': '#4ECDC4',
  };
  const domainColor = (lesson?.domainSlug && DOMAIN_COLORS[lesson.domainSlug]) || 'var(--tk-cyan)';
  const timeDisplay = session.time_spent_min ? `${session.time_spent_min} min` : '30 min';

  return (
    <div className="tk-day">
      <button className="tk-day-row" onClick={handleExpand}>
        <button
          className={`tk-checkbox${isComplete ? ' checked' : ''}`}
          onClick={handleCheckboxClick}
          aria-label={isComplete ? 'Mark session incomplete' : 'Mark session complete'}
        >
          {isComplete && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="tk-domain-dot" style={{ background: domainColor, width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
        <span className="tk-day-label">Day {dayIndex}</span>
        {lesson && <span className="tk-day-title">{lesson.title}</span>}
        <span className="tk-day-date">{formatDate(session.date)}</span>

        <span className={`tk-badge ${session.status}`}>{session.status}</span>

        <span className="tk-time-badge">
          <Clock size={10} />
          {timeDisplay}
        </span>

        <span className="tk-day-spacer" />

        <ChevronDown size={14} className={`tk-day-chevron${expanded ? ' open' : ''}`} />
      </button>

      {expanded && (
        <div className="tk-day-content">
          {/* Curriculum Content */}
          {lesson && (
            <>
              <div className="tk-lesson-header">
                <h4 className="tk-lesson-title">{lesson.title}</h4>
                <span className="tk-lesson-topic">{lesson.topicName}</span>
              </div>
              <ul className="tk-objectives">
                {lesson.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
              <div className="tk-steps">
                <h5 className="tk-section-label">Instructions</h5>
                <ol className="tk-step-list">
                  {lesson.steps.map((step, i) => (
                    <li key={i}>{step.instruction}</li>
                  ))}
                </ol>
              </div>

              {/* Hint + Code (gold border) */}
              <div className="tk-subsection gold">
                <button className="tk-subsection-header" onClick={() => setHintOpen((v) => !v)}>
                  <span>Hint + Code (Try First)</span>
                  <ChevronDown size={12} className={`tk-accordion-chevron${hintOpen ? ' open' : ''}`} />
                </button>
                {hintOpen && (
                  <div className="tk-subsection-body">
                    <p style={{ margin: '0 0 8px' }}>{lesson.hint.description}</p>
                    {lesson.hint.code && (
                      <pre className="tk-code-block"><code>{lesson.hint.code}</code></pre>
                    )}

                    {/* Full Solution (red dashed, nested) */}
                    <div className="tk-subsection danger">
                      <button className="tk-subsection-header" onClick={() => setSolutionOpen((v) => !v)}>
                        <span>Show Full Solution</span>
                        <ChevronDown size={12} className={`tk-accordion-chevron${solutionOpen ? ' open' : ''}`} />
                      </button>
                      {solutionOpen && (
                        <div className="tk-subsection-body">
                          <p style={{ margin: '0 0 8px' }}>{lesson.fullSolution.description}</p>
                          <pre className="tk-code-block"><code>{lesson.fullSolution.code}</code></pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Success Criteria (blue border) */}
              <div className="tk-subsection info">
                <button className="tk-subsection-header" onClick={() => setSuccessOpen((v) => !v)}>
                  <span>Success + Expected Output</span>
                  <ChevronDown size={12} className={`tk-accordion-chevron${successOpen ? ' open' : ''}`} />
                </button>
                {successOpen && (
                  <div className="tk-subsection-body">
                    <ul className="tk-success-list">
                      {lesson.successCriteria.map((sc, i) => (
                        <li key={i}>✓ {sc}</li>
                      ))}
                    </ul>
                    <p className="tk-takeaway"><em>{lesson.keyTakeaway}</em></p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Phase Checkboxes */}
          <div className="tk-phases">
            {PHASE_ORDER.map((key, idx) => {
              const meta = PHASE_META[key];
              const done = completedPhaseKeys.has(key);
              return (
                <div key={key} className="tk-phase-row">
                  <button
                    className={`tk-phase-check${done ? ' checked' : ''}`}
                    onClick={() => handlePhaseToggle(key, idx)}
                    aria-label={done ? `${meta.label} done` : `Complete ${meta.label}`}
                  >
                    {done && <Check size={10} strokeWidth={3} />}
                  </button>
                  <span className="tk-phase-name">{meta.label}</span>
                  <span className="tk-phase-time">{meta.defaultMin} min</span>
                </div>
              );
            })}
          </div>

          {/* Daily Plan subsection */}
          <div className="tk-subsection gold">
            <button
              className="tk-subsection-header"
              onClick={() => setPlanOpen((v) => !v)}
            >
              <span>Daily Plan</span>
              <ChevronDown size={12} className={`tk-accordion-chevron${planOpen ? ' open' : ''}`} />
            </button>
            {planOpen && (
              <div className="tk-subsection-body">
                {session.topics_json ? (
                  <p style={{ margin: 0 }}>
                    Topics: <code style={{
                      background: 'var(--tk-bg-deep)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                    }}>{session.topics_json}</code>
                  </p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--tk-text-muted)' }}>
                    No daily plan data available for this session.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Session Notes subsection */}
          <div className="tk-subsection neutral">
            <button
              className="tk-subsection-header"
              onClick={() => setNotesOpen((v) => !v)}
            >
              <span>Session Notes</span>
              <ChevronDown size={12} className={`tk-accordion-chevron${notesOpen ? ' open' : ''}`} />
            </button>
            {notesOpen && (
              <div className="tk-subsection-body">
                <textarea
                  className="tk-notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your session notes here..."
                />
                <div className="tk-slider-group">
                  <div className="tk-slider-item">
                    <div className="tk-slider-label">Confidence: {confidence}/10</div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                    />
                  </div>
                  <div className="tk-slider-item">
                    <div className="tk-slider-label">Energy: {energy}/10</div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={energy}
                      onChange={(e) => setEnergy(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
