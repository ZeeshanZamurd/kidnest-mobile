import { fetchParentChildren, type ParentChild } from '../api/parent';
import { CacheManager } from '../services/cache';
import { useAppStore } from '../store/useAppStore';

let inflight: Promise<ParentChild[]> | null = null;

/** Fetch parent children once per session; dedupes concurrent calls. */
export function loadParentChildren(force = false): Promise<ParentChild[]> {
  const { apiChildren, apiChildrenLoaded, setApiChildren, setApiChildrenLoaded } =
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

  inflight = fetchParentChildren()
    .then((children) => {
      setApiChildren(children);
      setApiChildrenLoaded(true);
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
