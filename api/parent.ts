import { apiRequest } from './client';

export type PlatformAccess = {
  hasAccess: boolean;
  accessType: 'FREE' | 'SUBSCRIPTION_REQUIRED';
  countryCode: string | null;
  countryName: string | null;
  subscriptionStatus: string | null;
  /** Premium subscriber — channels, unlimited videos, removable library. */
  canBrowseChannels?: boolean;
  canAssignChannels?: boolean;
  hasFullVideoAccess?: boolean;
  /** Max free video picks; null = unlimited (subscribed). */
  freeMaxAssignments?: number | null;
  /** Max videos visible on Discover without premium; null = unlimited. */
  freeVideoBrowseLimit?: number | null;
  /** Max free channels assignable without premium; null = unlimited. */
  freeMaxChannels?: number | null;
  /** Max videos included per assigned channel on free plan; null = unlimited. */
  freeChannelVideoLimit?: number | null;
  /** When true, free users are not capped on Discover browse. */
  freeUnlimitedBrowse?: boolean;
  subscription: {
    status: string;
    planName: string;
    currentPeriodEnd: string | null;
  } | null;
};

export type ParentChild = {
  id: string;
  age: number;
  isPaused: boolean;
  user: { id: string; displayName: string; email: string | null };
  _count?: { assignments: number };
};

export type CreateChildPayload = {
  displayName: string;
  email: string;
  password: string;
  age: number;
  dailyLimitMins?: number;
};

export type CreatedChildResponse = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  age: number;
};

export type ParentDashboard = {
  parent: {
    id: string;
    displayName: string;
    email: string | null;
    profileId: string;
    countryCode: string | null;
    countryName: string | null;
    accessType: string;
  };
  children: ParentChild[];
  limits: {
    maxChildren: number;
    maxChannels: number;
    maxVideos: number;
    maxAssignments: number;
    isPremium: boolean;
  };
  usage: { children: number; assignments: number; channels: number };
  platformAccess: PlatformAccess;
  subscription: { status: string; plan: string; currentPeriodEnd: string | null } | null;
};

export async function fetchParentDashboard() {
  return apiRequest<ParentDashboard>('/parents/dashboard', 'GET', {
    cache: {
      ttlMs: 3 * 60 * 1000,
      staleWhileRevalidate: true,
      persist: true,
    },
    cacheKey: 'parent:dashboard',
  });
}

export async function fetchParentChildren() {
  return apiRequest<ParentChild[]>('/parents/children', 'GET', {
    cache: {
      ttlMs: 10 * 60 * 1000,
      staleWhileRevalidate: true,
      persist: true,
    },
    cacheKey: 'parent:children',
  });
}

export async function createParentChild(payload: CreateChildPayload) {
  return apiRequest<CreatedChildResponse>('/parents/children', 'POST', {
    body: payload as unknown as Record<string, unknown>,
  });
}

export async function toggleChildPauseApi(childId: string) {
  return apiRequest<{ id: string; isPaused: boolean }>(
    `/parents/children/${childId}/pause`,
    'PATCH',
  );
}

export async function fetchPlatformAccess() {
  return apiRequest<PlatformAccess>('/users/me/access', 'GET', {
    cache: {
      ttlMs: 5 * 60 * 1000,
      staleWhileRevalidate: true,
      persist: true,
    },
    cacheKey: 'platform:access',
  });
}

export async function fetchCurrentUser() {
  return apiRequest<Record<string, unknown>>('/users/me', 'GET');
}
