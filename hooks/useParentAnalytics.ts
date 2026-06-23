import { useCallback, useEffect, useState } from 'react';
import { fetchParentAnalytics, type ParentAnalytics } from '../api/watch';

const EMPTY: ParentAnalytics = {
  totalWatchMinutes: 0,
  topCategory: 'general',
  weeklyUsage: [],
  mostWatchedVideos: [],
  categoryBreakdown: [],
  activeChildren: 0,
  totalWatchSessions: 0,
};

export function useParentAnalytics(childId: string | null, enabled: boolean) {
  const [analytics, setAnalytics] = useState<ParentAnalytics>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setAnalytics(EMPTY);
      setSubscriptionRequired(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSubscriptionRequired(false);

    try {
      const data = await fetchParentAnalytics(childId ?? undefined);
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      if (message.includes('SUBSCRIPTION_REQUIRED') || message.includes('403')) {
        setSubscriptionRequired(true);
      } else {
        setError(message);
      }
      setAnalytics(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [childId, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { analytics, loading, error, subscriptionRequired, reload };
}
