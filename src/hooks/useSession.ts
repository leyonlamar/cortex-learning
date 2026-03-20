import { useState, useCallback } from 'react';
import type { Session, DailyPlan } from '../types/models';
import {
  getToday, getSession, getSessionPhases, completePhase, completeSession,
  getDailyPlan,
} from '../lib/tauri-bridge';

export type PhaseKey = 'retrieval' | 'learning' | 'micro_task' | 'reflection';

const PHASE_ORDER: PhaseKey[] = ['retrieval', 'learning', 'micro_task', 'reflection'];

interface SessionState {
  session: Session | null;
  dailyPlan: DailyPlan | null;
  currentPhase: PhaseKey;
  completedPhases: Set<PhaseKey>;
  loading: boolean;
  error: string | null;
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    session: null,
    dailyPlan: null,
    currentPhase: 'retrieval',
    completedPhases: new Set(),
    loading: false,
    error: null,
  });

  const loadToday = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const session = await getToday();
      if (session) {
        // Restore phase state from DB so mid-session resume works
        const phases = await getSessionPhases(session.id);
        const completedPhases = new Set(
          phases.map((p) => p.phase as PhaseKey)
        );
        const firstIncomplete = PHASE_ORDER.find((p) => !completedPhases.has(p));
        const currentPhase = firstIncomplete ?? PHASE_ORDER[PHASE_ORDER.length - 1];
        setState((s) => ({ ...s, session, completedPhases, currentPhase, loading: false }));
      } else {
        setState((s) => ({ ...s, session, loading: false }));
      }
      return session;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, error: msg, loading: false }));
      return null;
    }
  }, []);

  const loadDailyPlan = useCallback(async (topicIds: string[]) => {
    try {
      const plan = await getDailyPlan(topicIds);
      setState((s) => ({ ...s, dailyPlan: plan }));
      return plan;
    } catch (err) {
      console.error('Failed to load daily plan:', err);
      return null;
    }
  }, []);

  const finishPhase = useCallback(async (
    sessionId: string,
    phase: PhaseKey,
    durationMin: number,
    content: string | null,
    score: number | null,
  ) => {
    const sortOrder = PHASE_ORDER.indexOf(phase);
    try {
      await completePhase(sessionId, phase, durationMin, content, score, sortOrder);
      setState((s) => {
        const completed = new Set(s.completedPhases);
        completed.add(phase);
        const nextIdx = sortOrder + 1;
        const nextPhase = nextIdx < PHASE_ORDER.length ? PHASE_ORDER[nextIdx] : s.currentPhase;
        return { ...s, completedPhases: completed, currentPhase: nextPhase };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, error: msg }));
    }
  }, []);

  const finishSession = useCallback(async (
    sessionId: string,
    timeSpentMin: number,
    retrievalScore: number,
    confidence: number,
    energyLevel: number,
    notes: string | null,
  ) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      await completeSession(sessionId, timeSpentMin, retrievalScore, confidence, energyLevel, notes);
      // Reload session to get updated status
      const updated = await getSession(sessionId);
      setState((s) => ({ ...s, session: updated, loading: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, error: msg, loading: false }));
    }
  }, []);

  const isPhaseUnlocked = useCallback((phase: PhaseKey) => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx === 0) return true;
    const prev = PHASE_ORDER[idx - 1];
    return state.completedPhases.has(prev);
  }, [state.completedPhases]);

  return {
    ...state,
    loadToday,
    loadDailyPlan,
    finishPhase,
    finishSession,
    isPhaseUnlocked,
    phaseOrder: PHASE_ORDER,
  } as const;
}
