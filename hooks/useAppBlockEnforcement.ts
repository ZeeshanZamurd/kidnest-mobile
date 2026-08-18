import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { fetchChildBlockedApps } from '../api/appBlock';
import { cacheBlockedApps, getCachedBlockedApps } from '../services/appBlockCache';
import {
  disableChildModeBlocking,
  enableChildModeBlocking,
} from '../services/appBlockSync';
import { isAppBlockSupported } from '../services/appBlockNative';
import { useAppStore } from '../store/useAppStore';

async function loadBlockedPackages(childId: string): Promise<string[]> {
  try {
    const blocked = await fetchChildBlockedApps(childId);
    const packages = blocked.map((app) => app.packageName);
    await cacheBlockedApps(childId, packages);
    return packages;
  } catch {
    return getCachedBlockedApps(childId);
  }
}

/** Syncs blocked apps from API and enables monitoring while child mode is active. */
export function useAppBlockEnforcement() {
  const role = useAppStore((s) => s.role);
  const activeChildId = useAppStore((s) => s.activeChildId);

  const sync = useCallback(async () => {
    if (!isAppBlockSupported || role !== 'child' || !activeChildId) {
      disableChildModeBlocking();
      return;
    }

    const packages = await loadBlockedPackages(activeChildId);
    enableChildModeBlocking(packages);
  }, [activeChildId, role]);

  useEffect(() => {
    void sync();
  }, [sync]);

  useEffect(() => {
    if (!isAppBlockSupported || role !== 'child') return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' || state === 'background') {
        void sync();
      }
    });
    return () => sub.remove();
  }, [role, sync]);
}
