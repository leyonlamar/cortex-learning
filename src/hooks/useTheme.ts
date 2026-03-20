import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types/models';
import { setTheme as setThemeApi } from '../lib/tauri-bridge';

const VALID_THEMES: Theme[] = ['glass', 'executive', 'brutalist', 'console', 'cyberpunk', 'luxury', 'nasa', 'studyhall'];

/**
 * Manages the active theme. Sets `data-theme` on `<html>` and
 * persists changes to the Rust backend via the Tauri bridge.
 */
export function useTheme(userId: string | null, initialTheme: Theme = 'glass') {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Set initial theme from user profile
  useEffect(() => {
    if (initialTheme && VALID_THEMES.includes(initialTheme)) {
      setThemeState(initialTheme);
    }
  }, [initialTheme]);

  const switchTheme = useCallback(async (newTheme: Theme) => {
    if (!VALID_THEMES.includes(newTheme)) return;

    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    // Persist to backend if we have a user
    if (userId) {
      try {
        await setThemeApi(userId, newTheme);
      } catch (err) {
        console.error('Failed to persist theme:', err);
        // Theme is already applied visually — don't revert on save failure
      }
    }
  }, [userId]);

  return { theme, switchTheme, themes: VALID_THEMES } as const;
}
