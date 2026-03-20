import { useState, useCallback } from 'react';
import {
  getRecallProbability, updateSpacedRep, getReviewQueue,
  updateBayesian, getMastery, runForecast, getBehavioralAlerts,
} from '../lib/tauri-bridge';
import type { BehavioralAlert } from '../types/models';

export function useIntelligence() {
  const [forecastResult, setForecastResult] = useState<[number, number, number] | null>(null);
  const [alerts, setAlerts] = useState<BehavioralAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async (
    attendanceRate: number, quizAvg: number, weeksRemaining: number, simCount: number = 50000,
  ) => {
    setLoading(true);
    try {
      const result = await runForecast(attendanceRate, quizAvg, weeksRemaining, simCount);
      setForecastResult(result);
      setError(null);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecall = useCallback(async (dtHours: number, memoryStrength: number) => {
    return getRecallProbability(dtHours, memoryStrength);
  }, []);

  const updateSpaced = useCallback(async (topicId: string, score: number, currentStrength: number) => {
    return updateSpacedRep(topicId, score, currentStrength);
  }, []);

  const fetchReviewQueue = useCallback(async (recallProbs: number[], limit: number) => {
    return getReviewQueue(recallProbs, limit);
  }, []);

  const updateBayes = useCallback(async (topicId: string, correct: boolean, weight: number) => {
    return updateBayesian(topicId, correct, weight);
  }, []);

  const fetchMastery = useCallback(async (topicId: string) => {
    return getMastery(topicId);
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const result = await getBehavioralAlerts();
      setAlerts(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return [];
    }
  }, []);

  return {
    forecastResult, alerts, loading, error,
    fetchForecast, fetchRecall, updateSpaced,
    fetchReviewQueue, updateBayes, fetchMastery, fetchAlerts,
  } as const;
}
