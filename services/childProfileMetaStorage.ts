import AsyncStorage from '@react-native-async-storage/async-storage';
import { avatarKeyForIndex, isAvatarKey, type AvatarKey } from '../constants/avatars';

const META_KEY = '@kidnest/child-profile-meta';

export type ChildProfileMeta = {
  avatarKey: AvatarKey;
  age?: number;
};

type MetaMap = Record<string, ChildProfileMeta>;

async function loadMap(): Promise<MetaMap> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MetaMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function saveMap(map: MetaMap): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(map));
}

export async function getChildProfileMeta(
  childId: string,
  fallbackIndex = 0,
): Promise<ChildProfileMeta> {
  const map = await loadMap();
  const existing = map[childId];
  if (existing && isAvatarKey(existing.avatarKey)) {
    return existing;
  }
  return { avatarKey: avatarKeyForIndex(fallbackIndex) };
}

export async function setChildAvatarKey(childId: string, avatarKey: AvatarKey): Promise<void> {
  const map = await loadMap();
  map[childId] = { ...map[childId], avatarKey };
  await saveMap(map);
}
