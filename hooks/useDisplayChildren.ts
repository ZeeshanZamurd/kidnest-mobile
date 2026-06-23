import { useCallback, useEffect, useState } from 'react';
import { fetchParentChildren, type ParentChild } from '../api/parent';
import { avatarKeyForIndex, isAvatarKey } from '../constants/avatars';
import { getChildProfileMeta } from '../services/childProfileMetaStorage';
import { useAppStore } from '../store/useAppStore';
import type { ChildProfile } from '../types';

function mapApiChildToProfile(child: ParentChild, avatar: string): ChildProfile {
  return {
    id: child.id,
    name: child.user.displayName,
    age: child.age,
    avatar,
    interests: [],
    screenTimeMinutes: 0,
    dailyLimitMinutes: 60,
    isPaused: child.isPaused,
    streakDays: 0,
    badges: [],
  };
}

export function useDisplayChildren() {
  const apiChildren = useAppStore((s) => s.apiChildren);
  const setApiChildren = useAppStore((s) => s.setApiChildren);
  const [displayChildren, setDisplayChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchParentChildren();
      setApiChildren(fresh);
    } catch {
      /* keep cached apiChildren */
    } finally {
      setLoading(false);
    }
  }, [setApiChildren]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (apiChildren.length === 0) {
      setDisplayChildren([]);
      return;
    }

    void Promise.all(
      apiChildren.map(async (child, index) => {
        const meta = await getChildProfileMeta(child.id, index);
        return mapApiChildToProfile(child, meta.avatarKey);
      }),
    ).then(setDisplayChildren);
  }, [apiChildren]);

  return { displayChildren, loading, reload, hasProfiles: apiChildren.length > 0 };
}

export async function resolveAvatarForChild(childId: string, index: number, legacyAvatar?: string) {
  const meta = await getChildProfileMeta(childId, index);
  if (legacyAvatar && isAvatarKey(legacyAvatar)) return legacyAvatar;
  return meta.avatarKey ?? avatarKeyForIndex(index);
}
