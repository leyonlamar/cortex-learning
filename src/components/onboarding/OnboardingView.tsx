import { useState } from 'react';
import { Card, Button, Spinner } from '../shared';
import type { Theme } from '../../types/models';
import { initCalendar } from '../../lib/tauri-bridge';

interface OnboardingViewProps {
  onComplete: (name: string, theme: Theme) => Promise<void>;
}

const THEME_OPTIONS: { id: Theme; label: string; color: string }[] = [
  { id: 'glass', label: 'Glass', color: '#6366f1' },
  { id: 'executive', label: 'Executive', color: '#1e293b' },
  { id: 'brutalist', label: 'Brutalist', color: '#000000' },
  { id: 'console', label: 'Console', color: '#22c55e' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: '#f0abfc' },
  { id: 'luxury', label: 'Luxury', color: '#d4a574' },
  { id: 'nasa', label: 'NASA', color: '#0ea5e9' },
  { id: 'studyhall', label: 'Study Hall', color: '#f59e0b' },
];

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('glass');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onComplete(name.trim(), selectedTheme);
      await initCalendar();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}
    >
      <Card className="w-full" style={{ maxWidth: '480px' }}>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Cortex
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {step === 1 ? 'What should we call you?' : 'Pick a theme'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="h-1 rounded-full"
                style={{
                  width: '40px',
                  background: s <= step ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  transition: 'background 0.2s ease',
                }}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) setStep(2);
                }}
                className="w-full px-3 py-2 text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <Button onClick={() => setStep(2)} disabled={!name.trim()}>
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTheme(t.id);
                      document.documentElement.setAttribute('data-theme', t.id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm border-none cursor-pointer text-left"
                    style={{
                      background:
                        selectedTheme === t.id ? t.color + '20' : 'var(--bg-tertiary)',
                      border:
                        selectedTheme === t.id
                          ? `2px solid ${t.color}`
                          : '2px solid transparent',
                      borderRadius: 'var(--border-radius)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ background: t.color }}
                    />
                    <span style={{ color: 'var(--text-primary)' }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {error && (
                <div
                  className="text-xs px-3 py-2"
                  style={{
                    color: 'var(--accent-danger)',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-3 py-2 text-sm border-none cursor-pointer"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--border-radius)',
                  }}
                >
                  Back
                </button>
                <div className="flex-1">
                  <Button onClick={handleFinish} disabled={loading}>
                    {loading ? <Spinner size={14} /> : 'Get Started'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
