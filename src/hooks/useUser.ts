import { useState, useEffect, useCallback } from 'react';
import type { User, Theme } from '../types/models';
import { createUser, getUser } from '../lib/tauri-bridge';

const USER_ID_KEY = 'learning-os-active-user';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load active user on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const savedId = localStorage.getItem(USER_ID_KEY);
        if (savedId) {
          const u = await getUser(savedId);
          setUser(u);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        // User not found — will need to create one
        localStorage.removeItem(USER_ID_KEY);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const create = useCallback(async (name: string, theme: Theme = 'glass') => {
    setLoading(true);
    try {
      const u = await createUser(name, theme);
      localStorage.setItem(USER_ID_KEY, u.id);
      setUser(u);
      setError(null);
      return u;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const switchUser = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const u = await getUser(userId);
      localStorage.setItem(USER_ID_KEY, u.id);
      setUser(u);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const u = await getUser(user.id);
      setUser(u);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    setUser(null);
    setError(null);
  }, []);

  return { user, loading, error, create, switchUser, refreshUser, logout } as const;
}
