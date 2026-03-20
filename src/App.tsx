import { useEffect, useState } from 'react';
import "./index.css";
import "./styles/motion.css";
import "./styles/completion-animations.css";
import "./themes/glass.css";
import "./themes/executive.css";
import "./themes/brutalist.css";
import "./themes/console.css";
import "./themes/cyberpunk.css";
import "./themes/luxury.css";
import "./themes/nasa.css";
import "./themes/studyhall.css";

import { AppShell } from './components/layout/AppShell';
import { TodayView } from './components/session/TodayView';
import { WeeklyView } from './components/weekly/WeeklyView';
import { TimelineView } from './components/timeline/TimelineView';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { ForecastView } from './components/forecast/ForecastView';
import { QuizView } from './components/quiz/QuizView';
import { SettingsView } from './components/settings/SettingsView';
import { OnboardingView } from './components/onboarding/OnboardingView';
import { UserPickerView } from './components/onboarding/UserPickerView';
import { useTheme } from './hooks/useTheme';
import { useUser } from './hooks/useUser';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ToastContext, useToastState } from './hooks/useToast';
import { Toast } from './components/shared/Toast';
import { registerToastHandler, listUsers } from './lib/tauri-bridge';
import type { ViewId } from './types/routes';
import type { User } from './types/models';
import { Spinner } from './components/shared';

type AppScreen = 'loading' | 'picker' | 'onboarding' | 'app';

function AppInner() {
  const { user, loading: userLoading, create, switchUser, logout } = useUser();
  const { theme, switchTheme, themes } = useTheme(user?.id ?? null, user?.theme ?? 'glass');
  const [activeView, setActiveView] = useState<ViewId>('quiz');
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [existingUsers, setExistingUsers] = useState<User[]>([]);

  useKeyboardShortcuts({
    onNavigate: setActiveView,
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

  const viewMap: Record<ViewId, React.ReactNode> = {
    today: <TodayView onNavigateToQuiz={() => setActiveView('quiz')} />,
    weekly: <WeeklyView onNavigateToQuiz={() => setActiveView('quiz')} />,
    timeline: <TimelineView onWeekClick={() => setActiveView('weekly')} />,
    analytics: <AnalyticsView />,
    forecast: <ForecastView />,
    quiz: <QuizView />,
    settings: (
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
    ),
  };

  return (
    <AppShell
      activeView={activeView}
      onNavigate={setActiveView}
      theme={theme}
      onThemeSwitch={switchTheme}
      themes={themes}
    >
      {viewMap[activeView]}
    </AppShell>
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
        <div key={t.id} style={{ bottom: `${1 + i * 4.5}rem`, position: 'fixed', right: 0, left: 0 }}>
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
