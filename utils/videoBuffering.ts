/** iOS often keeps `isBuffering` true while playing; hide spinner once playback has started. */
export function shouldShowVideoBuffering(
  hasDisplayedFrame: boolean,
  isBuffering: boolean,
  currentTime: number,
): boolean {
  if (currentTime > 0.25) {
    return false;
  }
  return !hasDisplayedFrame || isBuffering;
}

export function markPlaybackStarted(currentTime: number): boolean {
  return currentTime > 0.05;
}
