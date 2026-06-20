import { apiRequest } from './client';

export type TaxonomyItem = {
  id: string;
  name: string;
  slug?: string;
  code?: string;
  isPrimary?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Language = {
  id: string;
  name: string;
  code: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchCategories() {
  const res = await apiRequest<Paginated<Category>>('/categories', 'GET', {
    params: { limit: 100 },
  });
  return res.data;
}

export async function fetchLanguages() {
  const res = await apiRequest<Paginated<Language>>('/languages', 'GET', {
    params: { limit: 100 },
  });
  return res.data;
}

export type BrowseVideo = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSecs: number;
  contentType: 'VIDEO' | 'SHORT';
  channelName: string;
  channelId: string;
  createdAt: string;
  primaryCategory: TaxonomyItem | null;
  primaryLanguage: TaxonomyItem | null;
  categories: TaxonomyItem[];
  languages: TaxonomyItem[];
};

export type BrowseChannel = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoCount: number;
  shortCount?: number;
  totalCount?: number;
  createdAt: string;
  primaryCategory: TaxonomyItem | null;
  primaryLanguage: TaxonomyItem | null;
  categories: TaxonomyItem[];
  languages: TaxonomyItem[];
};

export async function browseVideos(params: {
  search?: string;
  categoryId?: string;
  languageId?: string;
  channelId?: string;
  contentType?: 'VIDEO' | 'SHORT';
  page?: number;
  limit?: number;
}) {
  return apiRequest<Paginated<BrowseVideo>>('/videos', 'GET', { params });
}

export async function browseChannels(params: {
  search?: string;
  categoryId?: string;
  languageId?: string;
  page?: number;
  limit?: number;
}) {
  return apiRequest<Paginated<BrowseChannel>>('/channels', 'GET', { params });
}

export type VideoDetail = BrowseVideo & {
  streamUrl: string | null;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  description: string | null;
};

export async function fetchChannelById(id: string) {
  return apiRequest<ChannelDetail>(`/channels/${id}`, 'GET');
}

export type ChannelDetail = BrowseChannel & {
  totalCount: number;
  shortCount: number;
};

export async function fetchVideoById(id: string) {
  return apiRequest<VideoDetail>(`/videos/${id}`, 'GET');
}

export function shortDescription(text: string | null | undefined, max = 100): string {
  if (!text?.trim()) return '';
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max).trim()}…`;
}

export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
