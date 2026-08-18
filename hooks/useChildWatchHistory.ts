import { useCallback, useEffect, useState } from 'react';
import {
  fetchChildContinueWatching,
  fetchChildWatchHistory,
  type WatchHistoryItem,
} from '../api/watch';

export function useChildWatchHistory(childId: string | null) {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(Boolean(childId));
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!childId) {
      setHistory([]);
      setContinueWatching([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const [hist, cont] = await Promise.all([
        fetchChildWatchHistory(childId),
        fetchChildContinueWatching(childId),
      ]);
      setHistory(hist);
      setContinueWatching(cont);
    } catch {
      setHistory([]);
      setContinueWatching([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { history, continueWatching, loading, error, reload };
}
