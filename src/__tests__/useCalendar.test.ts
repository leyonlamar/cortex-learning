import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '../hooks/useCalendar';
import type { Calendar, Week, Session } from '../types/models';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockCalendar: Calendar = {
  weeks: [],
  milestones: [],
  total_sessions: 52,
  completed_sessions: 10,
  attendance_rate: 80,
};

const mockWeek: Week = {
  id: 'week-1',
  week_num: 1,
  start_date: '2026-01-05',
  end_date: '2026-01-11',
  objective: 'Introduction',
  status: 'completed',
};

const mockSessions: Session[] = [
  {
    id: 'session-1',
    week_id: 'week-1',
    date: '2026-01-06',
    day_of_week: 1,
    status: 'completed',
    rescheduled_to: null,
    topics_json: null,
    tags_json: null,
    time_spent_min: 47,
    retrieval_score: 85,
    confidence: 4,
    energy_level: 3,
    notes: null,
    completed_at: '2026-01-06T10:00:00Z',
  },
];

describe('useCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialises with null state', () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.calendar).toBeNull();
    expect(result.current.currentWeek).toBeNull();
    expect(result.current.weekSessions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loadCalendar sets calendar state on success', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce(mockCalendar);

    const { result } = renderHook(() => useCalendar());
    await act(async () => {
      await result.current.loadCalendar();
    });

    expect(result.current.calendar).toEqual(mockCalendar);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loadCalendar returns the calendar value', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce(mockCalendar);

    const { result } = renderHook(() => useCalendar());
    let returned: Calendar | null = null;
    await act(async () => {
      returned = await result.current.loadCalendar();
    });

    expect(returned).toEqual(mockCalendar);
  });

  it('loadCalendar sets error and returns null on failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Calendar load failed'));

    const { result } = renderHook(() => useCalendar());
    let returned: Calendar | null = undefined as any;
    await act(async () => {
      returned = await result.current.loadCalendar();
    });

    expect(result.current.error).toBe('Calendar load failed');
    expect(result.current.calendar).toBeNull();
    expect(returned).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('selectWeek sets currentWeek and weekSessions on success', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke)
      .mockResolvedValueOnce(mockWeek)      // getWeek
      .mockResolvedValueOnce(mockSessions); // getSessionHistory

    const { result } = renderHook(() => useCalendar());
    await act(async () => {
      await result.current.selectWeek('week-1');
    });

    expect(result.current.currentWeek).toEqual(mockWeek);
    expect(result.current.weekSessions).toEqual(mockSessions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('selectWeek sets error on failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Week not found'));

    const { result } = renderHook(() => useCalendar());
    await act(async () => {
      await result.current.selectWeek('week-bad');
    });

    expect(result.current.error).toBe('Week not found');
    expect(result.current.currentWeek).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('sets loading to true during loadCalendar then false after', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    let resolveInvoke!: (v: Calendar) => void;
    vi.mocked(invoke).mockReturnValueOnce(
      new Promise<Calendar>((res) => { resolveInvoke = res; })
    );

    const { result } = renderHook(() => useCalendar());
    act(() => { void result.current.loadCalendar(); });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolveInvoke(mockCalendar); });
    expect(result.current.loading).toBe(false);
  });

  it('exposes selectWeek function', () => {
    const { result } = renderHook(() => useCalendar());
    expect(typeof result.current.selectWeek).toBe('function');
  });

  it('exposes loadCalendar function', () => {
    const { result } = renderHook(() => useCalendar());
    expect(typeof result.current.loadCalendar).toBe('function');
  });
});
