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

  const reload = useCallback(async () => {
    if (!childId) {
      setHistory([]);
      setContinueWatching([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { history, continueWatching, loading, reload };
}
