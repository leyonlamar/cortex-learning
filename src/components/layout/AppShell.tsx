import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import type { ViewId } from '../../types/routes';
import type { Theme, XpState } from '../../types/models';

interface AppShellProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  theme: Theme;
  onThemeSwitch: (theme: Theme) => void;
  themes: readonly Theme[];
  streak?: number;
  attendanceRate?: number;
  weekLabel?: string;
  dayLabel?: string;
  nextQuizLabel?: string | null;
  xpState?: XpState | null;
  onOpenCommandPalette?: () => void;
  children: ReactNode;
}

export function AppShell({
  activeView,
  onNavigate,
  theme,
  onThemeSwitch,
  themes,
  streak = 0,
  attendanceRate = 0,
  weekLabel = 'W01',
  dayLabel = '',
  nextQuizLabel = null,
  xpState,
  onOpenCommandPalette,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        attendanceRate={attendanceRate}
        xpState={xpState}
        onOpenCommandPalette={onOpenCommandPalette}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          activeView={activeView}
          streak={streak}
          theme={theme}
          onThemeSwitch={onThemeSwitch}
          themes={themes}
        />
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div key={activeView} className="animate-view-enter" style={{ minHeight: '100%' }}>
            {children}
          </div>
        </main>
        <StatusBar
          weekLabel={weekLabel}
          dayLabel={dayLabel}
          attendanceRate={attendanceRate}
          nextQuizLabel={nextQuizLabel}
        />
      </div>
    </div>
  );
}
