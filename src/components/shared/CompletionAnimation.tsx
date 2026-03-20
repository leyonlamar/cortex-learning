import { useEffect, useRef } from 'react';
import '../../styles/completion-animations.css';

type Theme =
  | 'glass'
  | 'executive'
  | 'brutalist'
  | 'console'
  | 'cyberpunk'
  | 'luxury'
  | 'nasa'
  | 'studyhall';

interface CompletionAnimationProps {
  /** Whether the animation is currently visible */
  active: boolean;
  /** Current theme — drives which animation plays */
  theme: Theme;
  /** 'session' = full session done, 'phase' = single phase done */
  type?: 'session' | 'phase';
  /** Called when the animation finishes and dismisses itself */
  onDismiss?: () => void;
}

/** Duration (ms) the overlay stays visible before calling onDismiss */
const DISMISS_DELAY = 2800;

/* ── Helper: detect theme from DOM when prop is not available ──────── */
function detectTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  const valid: Theme[] = ['glass', 'executive', 'brutalist', 'console', 'cyberpunk', 'luxury', 'nasa', 'studyhall'];
  return valid.includes(attr as Theme) ? (attr as Theme) : 'glass';
}

/* ── Sub-renderers ─────────────────────────────────────────────────── */

function GlassAnimation({ type }: { type: 'session' | 'phase' }) {
  return (
    <div className="completion-glass" aria-hidden="true">
      <div className="orb" />
      <div className="orb" />
      <div className="orb" />
      <div className="orb" />
      <div className="orb" />
      <div className="glass-label">
        {type === 'session' ? 'Session Complete ✦' : 'Phase Complete ✦'}
      </div>
    </div>
  );
}

function ExecutiveAnimation({ type }: { type: 'session' | 'phase' }) {
  return (
    <div className="completion-executive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute' }}>
      <div className="exec-card">
        <svg className="exec-svg" viewBox="0 0 40 40" aria-hidden="true">
          <circle className="exec-circle" cx="20" cy="20" r="18" />
          <circle className="exec-circle-gold" cx="20" cy="20" r="18" transform="rotate(-90 20 20)" />
          <polyline className="exec-check" points="11,21 17,27 29,14" />
        </svg>
        <span className="exec-label">
          {type === 'session' ? 'Session Complete' : 'Phase Complete'}
        </span>
      </div>
    </div>
  );
}

function BrutalistAnimation({ type }: { type: 'session' | 'phase' }) {
  return (
    <div className="completion-brutalist" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute' }}>
      <div className="brut-box">
        <span className="brut-word">{type === 'session' ? 'DONE' : 'NEXT'}</span>
        <span className="brut-sub">
          {type === 'session' ? 'SESSION COMPLETE' : 'PHASE UNLOCKED'}
        </span>
        <div className="brut-stripe" aria-hidden="true" />
      </div>
    </div>
  );
}

/* Matrix rain columns — deterministic to avoid hydration issues */
const COLS = [
  { left: '8%',  delay: 0,    duration: 2.2, chars: ['ア','イ','ウ','01','カ','キ'] },
  { left: '18%', delay: 0.15, duration: 2.6, chars: ['サ','シ','ス','10','タ','チ'] },
  { left: '30%', delay: 0.05, duration: 2.4, chars: ['ナ','ニ','ヌ','11','エ','オ'] },
  { left: '44%', delay: 0.3,  duration: 2.8, chars: ['ケ','コ','00','テ','ト','ア'] },
  { left: '57%', delay: 0.1,  duration: 2.3, chars: ['ツ','テ','01','ス','セ','ソ'] },
  { left: '70%', delay: 0.25, duration: 2.7, chars: ['キ','ク','10','ニ','ヌ','ネ'] },
  { left: '82%', delay: 0.4,  duration: 2.5, chars: ['チ','00','サ','ア','イ','ウ'] },
  { left: '92%', delay: 0.2,  duration: 2.1, chars: ['ノ','11','タ','カ','コ','ケ'] },
] as const;

function ConsoleAnimation({ type }: { type: 'session' | 'phase' }) {
  return (
    <div className="completion-console" style={{ inset: 0, position: 'absolute', overflow: 'hidden' }}>
      {COLS.map((col, i) => (
        <div
          key={i}
          className="rain-col"
          style={{
            left: col.left,
            animationDelay: `${col.delay}s`,
            animationDuration: `${col.duration}s`,
          }}
        >
          {col.chars.map((ch, j) => (
            <span key={j} className="rain-char">{ch}</span>
          ))}
        </div>
      ))}
      <div className="console-message" aria-live="polite">
        <span className="console-prompt">$ </span>
        {type === 'session' ? 'SESSION_COMPLETE' : 'PHASE_COMPLETE'}
        <span className="console-cursor" aria-hidden="true" />
      </div>
    </div>
  );
}

function CyberpunkAnimation({ type }: { type: 'session' | 'phase' }) {
  const label = type === 'session' ? 'MISSION DONE' : 'PHASE DONE';
  return (
    <div className="completion-cyberpunk" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute' }}>
      <div className="cyber-frame">
        <div className="cyber-scan-line" aria-hidden="true" />
        <span
          className="cyber-text"
          data-text={label}
          aria-label={label}
        >
          {label}
        </span>
        <span className="cyber-sub">
          {type === 'session' ? '// STATUS: COMPLETE' : '// NEXT PHASE UNLOCKED'}
        </span>
      </div>
    </div>
  );
}

function LuxuryAnimation({ type }: { type: 'session' | 'phase' }) {
  return (
    <div className="completion-luxury" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="leaf" />
      ))}
      <div
        className="luxury-card"
        role="status"
        aria-label={type === 'session' ? 'Session complete' : 'Phase complete'}
      >
        <span className="luxury-ornament">✦ ✦ ✦</span>
        <div className="luxury-rule" />
        <span className="luxury-title">
          {type === 'session' ? 'Session Complete' : 'Phase Complete'}
        </span>
        <div className="luxury-rule" />
        <span className="luxury-sub">
          {type === 'session' ? 'Excellently done' : 'Onward'}
        </span>
      </div>
    </div>
  );
}

function NasaAnimation({ type }: { type: 'session' | 'phase' }) {
  return (
    <div className="completion-nasa" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute' }}>
      <div className="nasa-panel" role="status">
        <div className="nasa-scanline" aria-hidden="true" />
        <div className="nasa-status-row">
          <div className="nasa-dot" aria-hidden="true" />
          <span>SYS NOMINAL</span>
        </div>
        <span className="nasa-mission">
          {type === 'session' ? 'LEARNING MISSION' : 'PHASE SEQUENCE'}
        </span>
        <span className="nasa-complete">
          {type === 'session' ? 'MISSION COMPLETE' : 'PHASE COMPLETE'}
        </span>
        <div className="nasa-progress-bar" aria-hidden="true">
          <div className="nasa-progress-fill" />
        </div>
        <span className="nasa-telemetry">
          {type === 'session' ? 'ALL OBJECTIVES ACHIEVED' : 'NEXT PHASE ARMED'}
        </span>
      </div>
    </div>
  );
}

/* Deterministic confetti layout */
const CONFETTI_PIECES = [
  { left: '5%',  width: 8,  height: 12, fallDur: 2.3, swayDur: 1.8, delay: 0 },
  { left: '12%', width: 6,  height: 10, fallDur: 2.7, swayDur: 2.1, delay: 0.1 },
  { left: '20%', width: 10, height: 8,  fallDur: 2.1, swayDur: 1.6, delay: 0.2 },
  { left: '28%', width: 7,  height: 11, fallDur: 2.9, swayDur: 2.3, delay: 0.05 },
  { left: '36%', width: 9,  height: 7,  fallDur: 2.4, swayDur: 1.9, delay: 0.3 },
  { left: '44%', width: 6,  height: 13, fallDur: 2.6, swayDur: 2.0, delay: 0.15 },
  { left: '52%', width: 11, height: 9,  fallDur: 2.2, swayDur: 1.7, delay: 0.25 },
  { left: '60%', width: 7,  height: 10, fallDur: 2.8, swayDur: 2.2, delay: 0.1 },
  { left: '68%', width: 9,  height: 8,  fallDur: 2.5, swayDur: 1.8, delay: 0.35 },
  { left: '76%', width: 6,  height: 12, fallDur: 2.3, swayDur: 2.4, delay: 0.2 },
  { left: '84%', width: 8,  height: 7,  fallDur: 2.7, swayDur: 1.6, delay: 0.05 },
  { left: '92%', width: 10, height: 11, fallDur: 2.1, swayDur: 2.0, delay: 0.4 },
] as const;

function StudyhallAnimation({ type }: { type: 'session' | 'phase' }) {
  return (
    <div className="completion-studyhall" aria-hidden="true">
      {CONFETTI_PIECES.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            width: `${p.width}px`,
            height: `${p.height}px`,
            animationDuration: `${p.fallDur}s, ${p.swayDur}s`,
            animationDelay: `${p.delay}s, ${p.delay}s`,
          }}
        />
      ))}
      <div
        className="studyhall-message"
        role="status"
        aria-label={type === 'session' ? 'Session complete' : 'Phase complete'}
      >
        <span className="studyhall-icon">{type === 'session' ? '🎉' : '✅'}</span>
        <span className="studyhall-title">
          {type === 'session' ? 'Session Complete!' : 'Phase Done!'}
        </span>
        <span className="studyhall-sub">
          {type === 'session' ? 'Great work today' : 'Keep going'}
        </span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */

export function CompletionAnimation({
  active,
  theme,
  type = 'session',
  onDismiss,
}: CompletionAnimationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active && onDismiss) {
      timerRef.current = setTimeout(onDismiss, DISMISS_DELAY);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onDismiss]);

  if (!active) return null;

  const resolvedTheme = theme ?? detectTheme();

  return (
    <div
      className="completion-overlay"
      role="status"
      aria-live="polite"
      aria-label={type === 'session' ? 'Session complete' : 'Phase complete'}
    >
      {resolvedTheme === 'glass'      && <GlassAnimation type={type} />}
      {resolvedTheme === 'executive'  && <ExecutiveAnimation type={type} />}
      {resolvedTheme === 'brutalist'  && <BrutalistAnimation type={type} />}
      {resolvedTheme === 'console'    && <ConsoleAnimation type={type} />}
      {resolvedTheme === 'cyberpunk'  && <CyberpunkAnimation type={type} />}
      {resolvedTheme === 'luxury'     && <LuxuryAnimation type={type} />}
      {resolvedTheme === 'nasa'       && <NasaAnimation type={type} />}
      {resolvedTheme === 'studyhall'  && <StudyhallAnimation type={type} />}
    </div>
  );
}
