/**
 * YouTube-like buffering visibility.
 * - Before first frame: show when `isBuffering`.
 * - Mid-play: show when `isBuffering && isStalled` (stall avoids iOS false positives).
 * - Legacy callers may pass `currentTime` as the third arg (number); mid-play then
 *   shows whenever `isBuffering` is true after the first frames.
 */
export function shouldShowVideoBuffering(
  hasDisplayedFrame: boolean,
  isBuffering: boolean,
  isStalledOrCurrentTime: boolean | number = true,
): boolean {
  if (!isBuffering && hasDisplayedFrame) {
    return false;
  }
  if (!hasDisplayedFrame) {
    return isBuffering;
  }
  if (typeof isStalledOrCurrentTime === 'number') {
    return isBuffering;
  }
  return isBuffering && isStalledOrCurrentTime;
}

export function markPlaybackStarted(currentTime: number): boolean {
  return currentTime > 0.05;
}
