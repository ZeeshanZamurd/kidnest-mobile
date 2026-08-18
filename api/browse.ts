import { apiRequest } from './client';
import {
  DEFAULT_API_TTL_MS,
  FEED_API_TTL_MS,
  LONG_API_TTL_MS,
} from '../services/cache/types';

const BROWSE_CACHE = {
  ttlMs: DEFAULT_API_TTL_MS,
  staleWhileRevalidate: true,
  persist: true,
} as const;

const TAXONOMY_CACHE = {
  ttlMs: LONG_API_TTL_MS,
  staleWhileRevalidate: true,
  persist: true,
} as const;

const DETAIL_CACHE = {
  ttlMs: DEFAULT_API_TTL_MS,
  staleWhileRevalidate: true,
  persist: true,
} as const;

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

const API_PAGE_LIMIT_MAX = 100;

function clampPageLimit(limit?: number, fallback = 20): number {
  const value = limit ?? fallback;
  return Math.min(Math.max(1, value), API_PAGE_LIMIT_MAX);
}

export async function fetchCategories() {
  const res = await apiRequest<Paginated<Category>>('/categories', 'GET', {
    params: { limit: 100 },
    cache: TAXONOMY_CACHE,
    cacheKey: 'taxonomy:categories',
  });
  return res.data;
}

export async function fetchLanguages() {
  const res = await apiRequest<Paginated<Language>>('/languages', 'GET', {
    params: { limit: 100 },
    cache: TAXONOMY_CACHE,
    cacheKey: 'taxonomy:languages',
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
  channelThumbnailUrl?: string | null;
  isPremium?: boolean;
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
  isPremium?: boolean;
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
  return apiRequest<Paginated<BrowseVideo>>('/videos', 'GET', {
    params: { ...params, limit: clampPageLimit(params.limit) },
    cache: BROWSE_CACHE,
  });
}

export async function browseChannels(params: {
  search?: string;
  categoryId?: string;
  languageId?: string;
  page?: number;
  limit?: number;
}) {
  return apiRequest<Paginated<BrowseChannel>>('/channels', 'GET', {
    params: { ...params, limit: clampPageLimit(params.limit) },
    cache: BROWSE_CACHE,
  });
}

export type VideoStream = {
  quality: string;
  label: string;
  height: number;
  streamUrl: string;
  isDefault: boolean;
};

export type VideoDetail = BrowseVideo & {
  streamUrl: string | null;
  streams?: VideoStream[];
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  description: string | null;
};

export async function fetchChannelById(id: string) {
  return apiRequest<ChannelDetail>(`/channels/${id}`, 'GET', {
    cache: DETAIL_CACHE,
    cacheKey: `channel:${id}`,
  });
}

export type ChannelDetail = BrowseChannel & {
  totalCount: number;
  shortCount: number;
};

export async function fetchVideoById(id: string) {
  return apiRequest<VideoDetail>(`/videos/${id}`, 'GET', {
    cache: DETAIL_CACHE,
    cacheKey: `video:${id}`,
  });
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
