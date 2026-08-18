import { create } from 'zustand';
import {
  MOCK_ANALYTICS,
  MOCK_CHANNELS,
  MOCK_CHILDREN,
  MOCK_NOTIFICATIONS,
  MOCK_PARENT,
  MOCK_VIDEOS,
} from '../data/mockData';
import { persistCurrentAuthMeta } from '../services/authBootstrap';
import { clearAuthMeta } from '../services/authStorage';
import type { BackendUser } from '../types/auth';
import type { AppNotification, ChildProfile, UserRole, Video } from '../types';

import type { PlatformAccess, ParentChild } from '../api/parent';

type ParentSession = {
  backendUser: BackendUser;
  idToken: string;
};

type AppState = {
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  role: UserRole | null;
  activeChildId: string | null;
  parentSession: ParentSession | null;
  platformAccess: PlatformAccess | null;
  subscriptionPromptDismissed: boolean;
  apiChildren: ParentChild[];
  apiChildrenLoaded: boolean;
  parent: typeof MOCK_PARENT;
  children: ChildProfile[];
  videos: Video[];
  notifications: AppNotification[];
  autoplayEnabled: boolean;
  searchQuery: string;
  childFavoriteVideoIds: string[];
  childFavoriteChannelIds: string[];

  setAuthenticated: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  setRole: (role: UserRole) => void;
  setActiveChild: (childId: string) => void;
  toggleVideoFavorite: (videoId: string) => void;
  toggleChannelFavorite: (channelId: string) => void;
  setChildFavoriteIds: (videoIds: string[], channelIds: string[]) => void;
  approveVideo: (videoId: string) => void;
  blockVideo: (videoId: string) => void;
  toggleChildPause: (childId: string) => void;
  markNotificationRead: (id: string) => void;
  setAutoplay: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  setParentSession: (session: ParentSession, platformAccess?: PlatformAccess | null) => void;
  setPlatformAccess: (access: PlatformAccess | null) => void;
  dismissSubscriptionPrompt: () => void;
  setApiChildren: (children: ParentChild[]) => void;
  setApiChildrenLoaded: (loaded: boolean) => void;
  login: (role: UserRole, childId?: string) => void;
  exitProfileMode: () => void;
  logout: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  hasOnboarded: false,
  role: null,
  activeChildId: null,
  parentSession: null,
  platformAccess: null,
  subscriptionPromptDismissed: false,
  apiChildren: [],
  apiChildrenLoaded: false,
  parent: MOCK_PARENT,
  children: MOCK_CHILDREN,
  videos: MOCK_VIDEOS,
  notifications: MOCK_NOTIFICATIONS,
  autoplayEnabled: true,
  searchQuery: '',
  childFavoriteVideoIds: [],
  childFavoriteChannelIds: [],

  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setOnboarded: (value) => {
    set({ hasOnboarded: value });
    void persistCurrentAuthMeta();
  },
  setRole: (role) => set({ role }),
  setActiveChild: (childId) => set({ activeChildId: childId }),

  setChildFavoriteIds: (videoIds, channelIds) =>
    set({ childFavoriteVideoIds: videoIds, childFavoriteChannelIds: channelIds }),

  toggleVideoFavorite: (videoId) =>
    set({
      videos: get().videos.map((v) =>
        v.id === videoId ? { ...v, isFavorite: !v.isFavorite } : v,
      ),
      childFavoriteVideoIds: get().childFavoriteVideoIds.includes(videoId)
        ? get().childFavoriteVideoIds.filter((id) => id !== videoId)
        : [...get().childFavoriteVideoIds, videoId],
    }),

  toggleChannelFavorite: (channelId) =>
    set({
      childFavoriteChannelIds: get().childFavoriteChannelIds.includes(channelId)
        ? get().childFavoriteChannelIds.filter((id) => id !== channelId)
        : [...get().childFavoriteChannelIds, channelId],
    }),

  approveVideo: (videoId) =>
    set({
      videos: get().videos.map((v) =>
        v.id === videoId ? { ...v, status: 'approved' as const } : v,
      ),
    }),

  blockVideo: (videoId) =>
    set({
      videos: get().videos.map((v) =>
        v.id === videoId ? { ...v, status: 'blocked' as const } : v,
      ),
    }),

  toggleChildPause: (childId) =>
    set({
      children: get().children.map((c) =>
        c.id === childId ? { ...c, isPaused: !c.isPaused } : c,
      ),
    }),

  markNotificationRead: (id) =>
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }),

  setAutoplay: (value) => set({ autoplayEnabled: value }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setParentSession: (session, platformAccess = null) => {
    set({
      parentSession: session,
      platformAccess,
      isAuthenticated: true,
      parent: {
        id: session.backendUser.id,
        name:
          session.backendUser.displayName?.trim() ||
          session.backendUser.email?.split('@')[0]?.trim() ||
          'Parent',
        email: session.backendUser.email ?? '',
        avatar: session.backendUser.avatarUrl ?? '',
        pinEnabled: false,
        biometricEnabled: false,
      },
    });
    void persistCurrentAuthMeta();
  },

  setPlatformAccess: (access) => set({ platformAccess: access }),
  dismissSubscriptionPrompt: () => set({ subscriptionPromptDismissed: true }),
  setApiChildren: (children) =>
    set({
      apiChildren: children,
      apiChildrenLoaded: true,
      activeChildId: get().activeChildId ?? children[0]?.id ?? null,
    }),
  setApiChildrenLoaded: (loaded) => set({ apiChildrenLoaded: loaded }),

  login: (role, childId) => {
    set({
      isAuthenticated: true,
      role,
      activeChildId: childId ?? get().activeChildId,
    });
  },

  exitProfileMode: () => {
    set({ role: null });
  },

  logout: () => {
    set({
      isAuthenticated: false,
      role: null,
      parentSession: null,
      platformAccess: null,
      subscriptionPromptDismissed: false,
      apiChildren: [],
      apiChildrenLoaded: false,
      childFavoriteVideoIds: [],
      childFavoriteChannelIds: [],
    });
    void clearAuthMeta();
  },
}));

export const useAnalytics = () => MOCK_ANALYTICS;
export const useChannels = () => MOCK_CHANNELS;
