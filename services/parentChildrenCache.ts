import { fetchParentChildren, type ParentChild } from '../api/parent';
import { CacheManager } from '../services/cache';
import { loadPersistedActiveChildId } from '../services/activeChildStorage';
import { useAppStore } from '../store/useAppStore';

let inflight: Promise<ParentChild[]> | null = null;

/** Fetch parent children once per session; dedupes concurrent calls. */
export function loadParentChildren(force = false): Promise<ParentChild[]> {
  const { apiChildren, apiChildrenLoaded, setApiChildren, setApiChildrenLoaded, setActiveChild } =
    useAppStore.getState();

  if (force) {
    CacheManager.invalidate('parent:children');
  }

  if (!force && apiChildrenLoaded) {
    return Promise.resolve(apiChildren);
  }

  if (inflight) {
    return inflight;
  }

  inflight = Promise.all([fetchParentChildren(), loadPersistedActiveChildId()])
    .then(([children, persistedId]) => {
      setApiChildren(children);
      setApiChildrenLoaded(true);
      if (persistedId && children.some((c) => c.id === persistedId)) {
        setActiveChild(persistedId);
      }
      return children;
    })
    .catch(() => {
      setApiChildrenLoaded(true);
      return useAppStore.getState().apiChildren;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function resetParentChildrenCache(): void {
  inflight = null;
}
