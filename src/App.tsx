import { useEffect, useState, useCallback } from 'react';
import "./index.css";
import "./styles/motion.css";
import "./styles/completion-animations.css";
import "./styles/tracker.css";
import "./themes/glass.css";
import "./themes/executive.css";
import "./themes/brutalist.css";
import "./themes/console.css";
import "./themes/cyberpunk.css";
import "./themes/luxury.css";
import "./themes/nasa.css";
import "./themes/studyhall.css";

import { AppShell } from './components/layout/AppShell';
import { TrackerPage } from './components/tracker/TrackerPage';
import { TodayView } from './components/session/TodayView';
import { WeeklyView } from './components/weekly/WeeklyView';
import { TimelineView } from './components/timeline/TimelineView';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { ForecastView } from './components/forecast/ForecastView';
import { QuizView } from './components/quiz/QuizView';
import { SettingsView } from './components/settings/SettingsView';
import { OnboardingView } from './components/onboarding/OnboardingView';
import { UserPickerView } from './components/onboarding/UserPickerView';
import { NotesView } from './components/notes/NotesView';
import { FocusView } from './components/focus/FocusView';
import { FlashcardsView } from './components/flashcards/FlashcardsView';
import { AchievementsView } from './components/achievements/AchievementsView';
import { CommandPalette } from './components/command-palette/CommandPalette';
import { useTheme } from './hooks/useTheme';
import { useUser } from './hooks/useUser';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ToastContext, useToastState } from './hooks/useToast';
import { Toast } from './components/shared/Toast';
import { registerToastHandler, listUsers, getXpState } from './lib/tauri-bridge';
import type { ViewId } from './types/routes';
import type { User, XpState } from './types/models';
import { Spinner } from './components/shared';

type AppScreen = 'loading' | 'picker' | 'onboarding' | 'app';

function AppInner() {
  const { user, loading: userLoading, create, switchUser, logout } = useUser();
  const { theme, switchTheme, themes } = useTheme(user?.id ?? null, user?.theme ?? 'glass');
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [xpState, setXpState] = useState<XpState | null>(null);

  // Load XP state
  const loadXp = useCallback(async () => {
    try {
      const xp = await getXpState();
      setXpState(xp);
    } catch { /* xp not available */ }
  }, []);

  useEffect(() => { if (user) loadXp(); }, [user, loadXp]);

  // Ctrl+K command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useKeyboardShortcuts({
    onNavigate: (view: ViewId) => setActiveView(view),
    activeView,
    themes,
    currentTheme: theme,
    onThemeSwitch: switchTheme,
  });

  // After useUser finishes loading, decide which screen to show
  useEffect(() => {
    if (userLoading) return;
    if (user) {
      setScreen('app');
      return;
    }
    // No active user in localStorage — check how many users exist in DB
    listUsers().then((users) => {
      setExistingUsers(users);
      setScreen(users.length === 0 ? 'onboarding' : 'picker');
    }).catch(() => {
      setScreen('onboarding');
    });
  }, [userLoading, user]);

  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh', background: 'var(--bg-primary)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (screen === 'picker') {
    return (
      <UserPickerView
        users={existingUsers}
        onSelect={async (userId) => {
          await switchUser(userId);
          setScreen('app');
        }}
        onCreateNew={() => setScreen('onboarding')}
      />
    );
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingView
        onComplete={async (name, selectedTheme) => {
          await create(name, selectedTheme);
          setScreen('app');
        }}
      />
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <TrackerPage onOpenSettings={() => setActiveView('settings')} />;
      case 'today':
        return <div className="p-6"><TodayView onNavigateToQuiz={() => setActiveView('quiz')} /></div>;
      case 'weekly':
        return <div className="p-6"><WeeklyView /></div>;
      case 'timeline':
        return <div className="p-6"><TimelineView /></div>;
      case 'analytics':
        return <div className="p-6"><AnalyticsView /></div>;
      case 'forecast':
        return <div className="p-6"><ForecastView /></div>;
      case 'quiz':
        return <div className="p-6"><QuizView /></div>;
      case 'notes':
        return <div className="p-6"><NotesView /></div>;
      case 'focus':
        return <div className="p-6"><FocusView /></div>;
      case 'flashcards':
        return <div className="p-6"><FlashcardsView /></div>;
      case 'achievements':
        return <div className="p-6"><AchievementsView /></div>;
      case 'settings':
        return (
          <div className="p-6">
            <SettingsView
              theme={theme}
              onThemeSwitch={switchTheme}
              userName={user?.name ?? null}
              onCreateUser={(name) => create(name, theme)}
              onSwitchProfile={async () => {
                logout();
                const users = await listUsers();
                setExistingUsers(users);
                setScreen(users.length === 0 ? 'onboarding' : 'picker');
              }}
            />
          </div>
        );
      default:
        return <TrackerPage onOpenSettings={() => setActiveView('settings')} />;
    }
  };

  return (
    <>
      <AppShell
        activeView={activeView}
        onNavigate={setActiveView}
        theme={theme}
        onThemeSwitch={switchTheme}
        themes={themes}
        xpState={xpState}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      >
        {renderView()}
      </AppShell>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(view) => { setActiveView(view); setCommandPaletteOpen(false); }}
      />
    </>
  );
}

function App() {
  const toastState = useToastState();

  useEffect(() => {
    registerToastHandler((message) => toastState.showToast(message, 'error'));
  }, [toastState.showToast]);

  return (
    <ToastContext.Provider value={toastState}>
      <AppInner />
      {toastState.toasts.map((t, i) => (
        <div key={t.id} style={{ bottom: `${1 + i * 4.5}rem`, position: 'fixed', right: 0, left: 0, zIndex: 100 }}>
          <Toast
            message={t.message}
            type={t.severity}
            visible={true}
            onDismiss={() => toastState.dismissToast(t.id)}
            durationMs={5000}
          />
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export default App;
