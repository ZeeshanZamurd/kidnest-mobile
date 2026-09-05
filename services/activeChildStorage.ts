import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@kidnest/active-child-id';

export async function loadPersistedActiveChildId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function persistActiveChildId(childId: string | null): Promise<void> {
  try {
    if (!childId) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    await AsyncStorage.setItem(KEY, childId);
  } catch {
    /* ignore */
  }
}

export async function clearPersistedActiveChildId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
