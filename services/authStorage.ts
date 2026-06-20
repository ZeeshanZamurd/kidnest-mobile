import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRole } from '../types';

const STORAGE_KEYS = {
  onboarded: '@kidnest/onboarded',
  role: '@kidnest/role',
  activeChild: '@kidnest/active-child',
} as const;

export type PersistedAuthMeta = {
  hasOnboarded: boolean;
  role: UserRole | null;
  activeChildId: string | null;
};

export async function loadAuthMeta(): Promise<PersistedAuthMeta> {
  try {
    const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
    const map = Object.fromEntries(entries) as Record<string, string | null>;

    const role = map[STORAGE_KEYS.role];
    const parsedRole =
      role === 'parent' || role === 'child' ? (role as UserRole) : null;

    return {
      hasOnboarded: map[STORAGE_KEYS.onboarded] === 'true',
      role: parsedRole,
      activeChildId: map[STORAGE_KEYS.activeChild] ?? null,
    };
  } catch {
    return { hasOnboarded: false, role: null, activeChildId: null };
  }
}

export async function saveAuthMeta(meta: PersistedAuthMeta): Promise<void> {
  try {
    const pairs: [string, string][] = [
      [STORAGE_KEYS.onboarded, String(meta.hasOnboarded)],
    ];
    if (meta.role) {
      pairs.push([STORAGE_KEYS.role, meta.role]);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.role);
    }
    if (meta.activeChildId) {
      pairs.push([STORAGE_KEYS.activeChild, meta.activeChildId]);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.activeChild);
    }
    await AsyncStorage.multiSet(pairs);
  } catch {
    /* ignore */
  }
}

export async function clearAuthMeta(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch {
    /* ignore */
  }
}
