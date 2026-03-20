import { useEffect } from 'react';
import type { ViewId } from '../types/routes';
import type { Theme } from '../types/models';

const VIEW_SHORTCUTS: Record<string, ViewId> = {
  '1': 'today',
  '2': 'weekly',
  '3': 'timeline',
  '4': 'analytics',
  '5': 'forecast',
  '6': 'quiz',
  '7': 'settings',
};

interface UseKeyboardShortcutsOptions {
  onNavigate: (view: ViewId) => void;
  activeView: ViewId;
  themes: readonly Theme[];
  currentTheme: Theme;
  onThemeSwitch: (theme: Theme) => void;
}

/**
 * Global keyboard shortcuts for Learning OS 2026.
 *
 * Ctrl/Cmd + 1-7  → Navigate to the corresponding view
 * Ctrl/Cmd + T    → Cycle to the next theme
 * Ctrl/Cmd + Enter → Complete the current session phase (Today view only)
 */
export function useKeyboardShortcuts({
  onNavigate,
  activeView,
  themes,
  currentTheme,
  onThemeSwitch,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const modifier = e.ctrlKey || e.metaKey;
      if (!modifier) return;

      // View navigation: Ctrl/Cmd + 1-7
      const targetView = VIEW_SHORTCUTS[e.key];
      if (targetView) {
        e.preventDefault();
        onNavigate(targetView);
        return;
      }

      // Theme cycling: Ctrl/Cmd + T
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const idx = themes.indexOf(currentTheme);
        const nextTheme = themes[(idx + 1) % themes.length];
        onThemeSwitch(nextTheme);
        return;
      }

      // Complete current phase: Ctrl/Cmd + Enter (Today view only)
      if (e.key === 'Enter' && activeView === 'today') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('learning-os:complete-phase'));
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, activeView, themes, currentTheme, onThemeSwitch]);
}
