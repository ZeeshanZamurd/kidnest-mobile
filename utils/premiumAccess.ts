/** True when parent lacks subscription and item requires premium. */
export function isVideoPremiumLocked(
  video: { isPremium?: boolean },
  hasPremiumAccess: boolean,
): boolean {
  if (hasPremiumAccess) return false;
  return Boolean(video.isPremium);
}

/** Channels may require subscription at platform or item level. */
export function isChannelPremiumLocked(
  channel: { isPremium?: boolean },
  hasPremiumAccess: boolean,
): boolean {
  if (hasPremiumAccess) return false;
  return Boolean(channel.isPremium);
}
