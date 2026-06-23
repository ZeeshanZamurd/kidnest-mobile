import { apiRequest } from './client';

export type PlatformAccess = {
  hasAccess: boolean;
  accessType: 'FREE' | 'SUBSCRIPTION_REQUIRED';
  countryCode: string | null;
  countryName: string | null;
  subscriptionStatus: string | null;
  /** Premium / full platform access (subscription or free region). */
  canBrowseChannels?: boolean;
  hasFullVideoAccess?: boolean;
  /** Max videos visible on Discover without premium; null = unlimited. */
  freeVideoBrowseLimit?: number | null;
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
  return apiRequest<ParentDashboard>('/parents/dashboard', 'GET');
}

export async function fetchParentChildren() {
  return apiRequest<ParentChild[]>('/parents/children', 'GET');
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
  return apiRequest<PlatformAccess>('/users/me/access', 'GET');
}

export async function fetchCurrentUser() {
  return apiRequest<Record<string, unknown>>('/users/me', 'GET');
}
