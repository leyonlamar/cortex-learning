import { useState, useCallback } from 'react';
import type { Calendar, Week, Session } from '../types/models';
import { initCalendar, getWeek, getSessionHistory } from '../lib/tauri-bridge';

export function useCalendar() {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const cal = await initCalendar();
      setCalendar(cal);
      setError(null);
      return cal;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectWeek = useCallback(async (weekId: string) => {
    setLoading(true);
    try {
      const [week, sessions] = await Promise.all([
        getWeek(weekId),
        getSessionHistory(weekId),
      ]);
      setCurrentWeek(week);
      setWeekSessions(sessions);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calendar, currentWeek, weekSessions,
    loading, error,
    loadCalendar, selectWeek,
  } as const;
}
