import { apiRequest } from './client';

export type WatchHistoryItem = {
  id: string;
  videoId: string;
  progressPercent: number;
  watchedSecs: number;
  completed: boolean;
  watchedAt: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    durationSecs: number;
    channelName: string;
    category: string;
  };
};

export type MostWatchedVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelName: string;
  watchCount: number;
  watchMinutes: number;
  category: string;
};

export type CategoryBreakdown = {
  category: string;
  minutes: number;
  percent: number;
};

export type ParentAnalytics = {
  totalWatchMinutes: number;
  topCategory: string;
  weeklyUsage: { day: string; minutes: number }[];
  mostWatchedVideos: MostWatchedVideo[];
  categoryBreakdown: CategoryBreakdown[];
  activeChildren: number;
  totalWatchSessions: number;
};

export async function recordChildWatch(
  childId: string,
  videoId: string,
  body: { progressPercent: number; watchedSecs: number },
) {
  return apiRequest(`/parents/children/${childId}/watch/${videoId}`, 'POST', { body });
}

export async function fetchChildWatchHistory(childId: string) {
  return apiRequest<WatchHistoryItem[]>(`/parents/children/${childId}/watch-history`, 'GET');
}

export async function fetchChildContinueWatching(childId: string) {
  return apiRequest<WatchHistoryItem[]>(
    `/parents/children/${childId}/continue-watching`,
    'GET',
  );
}

export async function fetchParentAnalytics(childId?: string) {
  return apiRequest<ParentAnalytics>('/parents/analytics', 'GET', {
    params: childId ? { childId } : undefined,
  });
}
