export const AVATAR_KEYS = [
  'lion',
  'panda',
  'fox',
  'bear',
  'rabbit',
  'owl',
  'koala',
  'tiger',
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

type AvatarConfig = {
  emoji: string;
  gradient: [string, string];
  label: string;
};

export const AVATARS: Record<AvatarKey, AvatarConfig> = {
  lion: { emoji: '🦁', gradient: ['#F59E0B', '#EF4444'], label: 'Lion' },
  panda: { emoji: '🐼', gradient: ['#9CA3AF', '#4B5563'], label: 'Panda' },
  fox: { emoji: '🦊', gradient: ['#FB923C', '#EA580C'], label: 'Fox' },
  bear: { emoji: '🐻', gradient: ['#D97706', '#92400E'], label: 'Bear' },
  rabbit: { emoji: '🐰', gradient: ['#FF72C8', '#FF4DB8'], label: 'Rabbit' },
  owl: { emoji: '🦉', gradient: ['#A88FFF', '#7B4DFF'], label: 'Owl' },
  koala: { emoji: '🐨', gradient: ['#94A3B8', '#64748B'], label: 'Koala' },
  tiger: { emoji: '🐯', gradient: ['#FBBF24', '#F97316'], label: 'Tiger' },
};

export function avatarKeyForIndex(index: number): AvatarKey {
  return AVATAR_KEYS[index % AVATAR_KEYS.length];
}

export function isAvatarKey(value: string): value is AvatarKey {
  return (AVATAR_KEYS as readonly string[]).includes(value);
}
