import { apiRequest } from './client';

export type AssignedVideo = {
  id: string;
  childId: string;
  videoId: string;
  assignedAt: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    durationSecs: number;
    channel: { id?: string; title: string };
  };
};

export type AssignedChannel = {
  id: string;
  childId: string;
  channelId: string;
  assignedAt: string;
  channel: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    primaryCategory: { id: string; name: string } | null;
    primaryLanguage: { id: string; name: string } | null;
  };
};

export type ChildLibrary = {
  videos: AssignedVideo[];
  channels: AssignedChannel[];
};

export async function fetchChildLibrary(childId: string) {
  return apiRequest<ChildLibrary>(`/assignments/child/${childId}`, 'GET');
}

export async function assignVideo(childId: string, videoId: string) {
  return apiRequest('/assignments/videos', 'POST', { body: { childId, videoId } });
}

export async function assignChannel(childId: string, channelId: string) {
  return apiRequest('/assignments/channels', 'POST', { body: { childId, channelId } });
}

export async function removeVideo(childId: string, videoId: string) {
  return apiRequest(`/assignments/child/${childId}/video/${videoId}`, 'DELETE');
}

export async function removeChannel(childId: string, channelId: string) {
  return apiRequest(`/assignments/child/${childId}/channel/${channelId}`, 'DELETE');
}
