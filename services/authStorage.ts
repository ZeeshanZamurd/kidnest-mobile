import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  onboarded: '@kidnest/onboarded',
} as const;

export type PersistedAuthMeta = {
  hasOnboarded: boolean;
};

export async function loadAuthMeta(): Promise<PersistedAuthMeta> {
  try {
    const onboarded = await AsyncStorage.getItem(STORAGE_KEYS.onboarded);
    return { hasOnboarded: onboarded === 'true' };
  } catch {
    return { hasOnboarded: false };
  }
}

export async function saveAuthMeta(meta: PersistedAuthMeta): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.onboarded, String(meta.hasOnboarded));
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
