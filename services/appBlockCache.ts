import AsyncStorage from '@react-native-async-storage/async-storage';

function cacheKey(childId: string) {
  return `@kidnest/blocked-apps/${childId}`;
}

export async function cacheBlockedApps(childId: string, packageNames: string[]): Promise<void> {
  await AsyncStorage.setItem(cacheKey(childId), JSON.stringify(packageNames));
}

export async function getCachedBlockedApps(childId: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(cacheKey(childId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    return [];
  }
}
