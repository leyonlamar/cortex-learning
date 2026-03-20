import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSession } from '../hooks/useSession';
import type { Session } from '../types/models';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockSession: Session = {
  id: 'session-1',
  week_id: 'week-1',
  date: '2026-03-19',
  day_of_week: 4,
  status: 'scheduled',
  rescheduled_to: null,
  topics_json: null,
  tags_json: null,
  time_spent_min: null,
  retrieval_score: null,
  confidence: null,
  energy_level: null,
  notes: null,
  completed_at: null,
};

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialises with default state', () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentPhase).toBe('retrieval');
    expect(result.current.completedPhases.size).toBe(0);
  });

  it('loadToday sets session on success', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke)
      .mockResolvedValueOnce(mockSession)   // getToday
      .mockResolvedValueOnce([]);            // getSessionPhases (no completed phases)

    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.loadToday();
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loadToday sets error on failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.loadToday();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('exposes phaseOrder with 4 phases', () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.phaseOrder).toEqual(['retrieval', 'learning', 'micro_task', 'reflection']);
  });

  it('isPhaseUnlocked returns true for retrieval (first phase) always', () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.isPhaseUnlocked('retrieval')).toBe(true);
  });

  it('isPhaseUnlocked returns false for learning before retrieval is complete', () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.isPhaseUnlocked('learning')).toBe(false);
  });

  it('finishPhase adds phase to completedPhases and advances currentPhase', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.finishPhase('session-1', 'retrieval', 5, null, null);
    });

    expect(result.current.completedPhases.has('retrieval')).toBe(true);
    expect(result.current.currentPhase).toBe('learning');
  });

  it('isPhaseUnlocked returns true for learning after retrieval is complete', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.finishPhase('session-1', 'retrieval', 5, null, null);
    });

    expect(result.current.isPhaseUnlocked('learning')).toBe(true);
  });

  it('finishPhase sets error on backend failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Complete failed'));

    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.finishPhase('session-1', 'retrieval', 5, null, null);
    });

    expect(result.current.error).toBe('Complete failed');
    expect(result.current.completedPhases.has('retrieval')).toBe(false);
  });

  it('loadDailyPlan returns and stores the plan', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockPlan = {
      time_allocation: { retrieval_min: 5, new_learning_min: 25, micro_task_min: 12, reflection_min: 5 },
      topic_ids: ['t1', 't2'],
      emphasis: 'balanced',
      rationale: 'Default plan',
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockPlan);

    const { result } = renderHook(() => useSession());
    await act(async () => {
      await result.current.loadDailyPlan(['t1', 't2']);
    });

    expect(result.current.dailyPlan).toEqual(mockPlan);
  });
});
