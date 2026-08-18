import { useMemo } from 'react';
import type { Video } from '../types';
import { useChildWatchHistory } from './useChildWatchHistory';

/** Attach watch-history progress to video lists for YouTube-style card bars. */
export function useVideosWithProgress(childId: string | null, videos: Video[]): Video[] {
  const { history } = useChildWatchHistory(childId);

  return useMemo(() => {
    const progressMap = new Map(
      history.map((item) => [item.videoId, item.progressPercent / 100]),
    );
    return videos.map((video) => ({
      ...video,
      watchProgress: progressMap.get(video.id) ?? video.watchProgress ?? 0,
    }));
  }, [videos, history]);
}
