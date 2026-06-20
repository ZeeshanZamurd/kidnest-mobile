import { useEffect } from 'react';
import { fetchParentChildren, fetchPlatformAccess } from '../api/parent';
import { useAppStore } from '../store/useAppStore';

/** Loads platform access + children whenever parent tabs mount. */
export function useParentBootstrap() {
  const parentSession = useAppStore((s) => s.parentSession);
  const setPlatformAccess = useAppStore((s) => s.setPlatformAccess);
  const setApiChildren = useAppStore((s) => s.setApiChildren);

  useEffect(() => {
    if (!parentSession?.idToken) return;

    void fetchPlatformAccess()
      .then(setPlatformAccess)
      .catch(() => {
        const user = parentSession.backendUser;
        const isFree = user.accessType === 'FREE';
        const hasAccess = isFree || !user.accessType;
        setPlatformAccess({
          hasAccess,
          accessType: user.accessType ?? 'SUBSCRIPTION_REQUIRED',
          countryCode: user.countryCode ?? null,
          countryName: user.countryName ?? null,
          subscriptionStatus: null,
          canBrowseChannels: hasAccess,
          hasFullVideoAccess: hasAccess,
          freeVideoBrowseLimit: hasAccess ? null : 10,
          subscription: null,
        });
      });

    void fetchParentChildren()
      .then(setApiChildren)
      .catch(() => {});
  }, [parentSession?.idToken, parentSession?.backendUser, setPlatformAccess, setApiChildren]);
}
