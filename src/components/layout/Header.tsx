import { Flame, Palette, ChevronRight } from 'lucide-react';
import type { ViewId } from '../../types/routes';
import type { Theme } from '../../types/models';

interface HeaderProps {
  activeView: ViewId;
  streak: number;
  theme: Theme;
  onThemeSwitch: (theme: Theme) => void;
  themes: readonly Theme[];
}

const VIEW_LABELS: Record<ViewId, string> = {
  today: 'Today',
  weekly: 'Weekly Review',
  timeline: 'Timeline',
  analytics: 'Analytics',
  forecast: 'Forecast',
  quiz: 'Quiz',
  settings: 'Settings',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night';
}

export function Header({ activeView, streak, theme, onThemeSwitch, themes }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-5 shrink-0 glass-subtle"
      style={{
        height: 'var(--header-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 animate-fade-in">
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {getGreeting()}
        </span>
        <ChevronRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {VIEW_LABELS[activeView]}
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Streak */}
        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 text-sm animate-pop"
            style={{ color: 'var(--accent-warning)', fontFamily: 'var(--font-code)' }}
          >
            <Flame size={16} />
            <span className="font-semibold">{streak}d</span>
          </div>
        )}

        {/* Theme switcher */}
        <button
          className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent text-sm transition-all duration-150"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => {
            const idx = themes.indexOf(theme);
            const next = themes[(idx + 1) % themes.length];
            onThemeSwitch(next);
          }}
          title={`Theme: ${theme} (click to cycle)`}
        >
          <Palette size={16} />
        </button>
      </div>
    </header>
  );
}
