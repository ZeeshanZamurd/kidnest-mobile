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

export async function fetchPlatformAccess() {
  return apiRequest<PlatformAccess>('/users/me/access', 'GET');
}

export async function fetchCurrentUser() {
  return apiRequest<Record<string, unknown>>('/users/me', 'GET');
}
