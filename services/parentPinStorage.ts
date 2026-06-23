import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_PREFIX = '@kidnest/parent-pin';
const SALT = 'kidnest-pin-v1';

function pinStorageKey(userId: string): string {
  return `${PIN_PREFIX}/${userId}`;
}

/** FNV-1a hash — sufficient for local 4-digit PIN verification. */
function hashPin(pin: string, userId: string): string {
  let h = 2166136261;
  const input = `${SALT}:${userId}:${pin}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export async function saveParentPin(userId: string, pin: string): Promise<void> {
  const hash = hashPin(pin, userId);
  await AsyncStorage.setItem(pinStorageKey(userId), hash);
}

export async function hasParentPin(userId: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(pinStorageKey(userId));
  return stored != null;
}

export async function verifyParentPin(userId: string, pin: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(pinStorageKey(userId));
  if (!stored) return true;
  return stored === hashPin(pin, userId);
}

export async function clearParentPin(userId: string): Promise<void> {
  await AsyncStorage.removeItem(pinStorageKey(userId));
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
