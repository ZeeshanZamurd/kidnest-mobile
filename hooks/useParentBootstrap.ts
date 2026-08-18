import { useEffect } from 'react';
import { fetchPlatformAccess } from '../api/parent';
import { loadParentChildren } from '../services/parentChildrenCache';
import { useAppStore } from '../store/useAppStore';

/** Loads platform access + children whenever parent tabs mount. */
export function useParentBootstrap() {
  const parentSession = useAppStore((s) => s.parentSession);
  const apiChildrenLoaded = useAppStore((s) => s.apiChildrenLoaded);
  const setPlatformAccess = useAppStore((s) => s.setPlatformAccess);

  useEffect(() => {
    if (!parentSession?.idToken) return;

    void fetchPlatformAccess()
      .then(setPlatformAccess)
      .catch(() => {
        const user = parentSession.backendUser;
        const isFree = user.accessType === 'FREE';
        setPlatformAccess({
          hasAccess: isFree,
          accessType: user.accessType ?? 'SUBSCRIPTION_REQUIRED',
          countryCode: user.countryCode ?? null,
          countryName: user.countryName ?? null,
          subscriptionStatus: null,
          canBrowseChannels: true,
          canAssignChannels: false,
          hasFullVideoAccess: false,
          freeMaxAssignments: 10,
          freeVideoBrowseLimit: isFree ? null : 10,
          subscription: null,
        });
      });

    if (!apiChildrenLoaded) {
      void loadParentChildren();
    }
  }, [apiChildrenLoaded, parentSession?.idToken, parentSession?.backendUser, setPlatformAccess]);
}
