import type { AssignedVideo } from '../api/assignments';
import type { ContentCategory, Video } from '../types';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const CATEGORY_SLUGS: ContentCategory[] = [
  'science',
  'math',
  'art',
  'music',
  'stories',
  'nature',
  'coding',
];

export function normalizeCategory(raw?: string | null): ContentCategory {
  const slug = raw?.toLowerCase().trim();
  if (slug && CATEGORY_SLUGS.includes(slug as ContentCategory)) {
    return slug as ContentCategory;
  }
  return 'stories';
}

export function mapAssignedVideoToVideo(assigned: AssignedVideo): Video {
  const { video } = assigned;
  return {
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnailUrl ?? '',
    duration: formatDuration(video.durationSecs),
    durationSeconds: video.durationSecs,
    channelId: video.channel.id ?? '',
    channelName: video.channel.title,
    category: normalizeCategory(video.category),
    contentType: video.contentType ?? 'VIDEO',
    streamUrl: video.streamUrl ?? null,
    status: 'approved',
    views: '0',
    publishedAt: assigned.assignedAt,
    isFavorite: false,
    watchProgress: 0,
  };
}
