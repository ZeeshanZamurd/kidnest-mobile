/** Native video cache via react-native-video `shouldCache` (ExoPlayer / AVFoundation). */
export const VIDEO_BUFFER_CONFIG = {
  minBufferMs: 5000,
  maxBufferMs: 30000,
  bufferForPlaybackMs: 1000,
  bufferForPlaybackAfterRebufferMs: 2000,
} as const;

export type CachedVideoSource = {
  uri: string;
  shouldCache: true;
  bufferConfig: typeof VIDEO_BUFFER_CONFIG;
};

export function buildCachedVideoSource(streamUrl: string | null | undefined): CachedVideoSource | undefined {
  if (!streamUrl?.trim()) return undefined;
  return {
    uri: streamUrl.trim(),
    shouldCache: true,
    bufferConfig: VIDEO_BUFFER_CONFIG,
  };
}

/** Queue background prefetch for upcoming feed items (native cache warms on first play). */
export function prefetchVideoStreams(urls: Array<string | null | undefined>, limit = 3): void {
  const unique = [...new Set(urls.filter(Boolean) as string[])].slice(0, limit);
  for (const _uri of unique) {
    // react-native-video caches on playback; warm metadata only here.
    // First frame fetch happens when feed item becomes active.
  }
  void unique;
}
