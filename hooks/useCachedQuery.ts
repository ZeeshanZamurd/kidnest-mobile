import { useCallback, useEffect, useRef, useState } from 'react';
import { CacheManager, type CachePolicy } from '../services/cache';

type UseCachedQueryOptions<T> = {
  key: string;
  policy: CachePolicy;
  fetcher: () => Promise<T>;
  enabled?: boolean;
};

type UseCachedQueryResult<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: (silent?: boolean) => Promise<void>;
};

export function useCachedQuery<T>({
  key,
  policy,
  fetcher,
  enabled = true,
}: UseCachedQueryOptions<T>): UseCachedQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(
    async (silent = false) => {
      if (!enabled) return;

      const cached = await CacheManager.get<T>(key, policy);
      if (cached && !silent) {
        setData(cached.data);
        setLoading(false);
      } else if (!cached && !silent) {
        setLoading(true);
      } else if (cached && silent) {
        setData(cached.data);
      }

      const shouldBackground =
        cached != null && policy.staleWhileRevalidate && CacheManager.isStale(cached, policy);

      if (cached && !shouldBackground && !CacheManager.isStale(cached, policy)) {
        return;
      }

      if (silent || shouldBackground) setRefreshing(true);

      try {
        const fresh = await fetcherRef.current();
        await CacheManager.set(key, fresh, policy);
        setData(fresh);
        setError(null);
      } catch (err) {
        if (!cached) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, key, policy],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, refreshing, error, reload };
}
