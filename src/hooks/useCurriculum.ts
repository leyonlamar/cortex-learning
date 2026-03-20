import { useState, useCallback } from 'react';
import type { Domain, Topic } from '../types/models';
import { getDomains, getTopicsByDomain } from '../lib/tauri-bridge';

export function useCurriculum() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [topicsByDomain, setTopicsByDomain] = useState<Record<string, Topic[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getDomains();
      setDomains(d);
      setError(null);
      return d;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTopics = useCallback(async (domainId: string) => {
    try {
      const topics = await getTopicsByDomain(domainId);
      setTopicsByDomain((prev) => ({ ...prev, [domainId]: topics }));
      return topics;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return [];
    }
  }, []);

  return {
    domains, topicsByDomain,
    loading, error,
    loadDomains, loadTopics,
  } as const;
}
