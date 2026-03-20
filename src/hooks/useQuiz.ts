import { useState, useCallback } from 'react';
import type { Quiz, QuizResults } from '../types/models';
import { generateQuiz, submitQuizAnswer, completeQuiz } from '../lib/tauri-bridge';

export function useQuiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback(async (
    weekId: string,
    topics: [string, string, string, number][],  // [id, name, slug, review_count]
    totalQuestions: number = 10,
  ) => {
    setLoading(true);
    setResults(null);
    setCurrentIndex(0);
    try {
      const q = await generateQuiz(weekId, topics, totalQuestions);
      setQuiz(q);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const answerQuestion = useCallback(async (questionId: string, answer: string) => {
    try {
      const correct = await submitQuizAnswer(questionId, answer);
      setCurrentIndex((i) => i + 1);
      return correct;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return false;
    }
  }, []);

  const finishQuiz = useCallback(async () => {
    if (!quiz) return null;
    setLoading(true);
    try {
      const r = await completeQuiz(quiz.id);
      setResults(r);
      setError(null);
      return r;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [quiz]);

  return {
    quiz, results, currentIndex,
    loading, error,
    startQuiz, answerQuestion, finishQuiz,
  } as const;
}
