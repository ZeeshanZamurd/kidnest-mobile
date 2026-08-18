import { apiRequest } from './client';

export type FavoriteVideoRecord = {
  id: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    channelName: string;
  };
};

export type FavoriteChannelRecord = {
  id: string;
  channel: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    description: string | null;
  };
};

export async function fetchChildFavorites(childId: string) {
  return apiRequest<FavoriteVideoRecord[]>(`/parents/children/${childId}/favorites`, 'GET');
}

export async function toggleChildVideoFavorite(childId: string, videoId: string) {
  return apiRequest<{ favorited: boolean }>(
    `/parents/children/${childId}/favorites/${videoId}`,
    'POST',
  );
}

export async function fetchChildChannelFavorites(childId: string) {
  return apiRequest<FavoriteChannelRecord[]>(
    `/parents/children/${childId}/channel-favorites`,
    'GET',
  );
}

export async function toggleChildChannelFavorite(childId: string, channelId: string) {
  return apiRequest<{ favorited: boolean }>(
    `/parents/children/${childId}/channel-favorites/${channelId}`,
    'POST',
  );
}
