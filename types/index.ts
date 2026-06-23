export type UserRole = 'parent' | 'child';

export type ContentCategory =
  | 'science'
  | 'math'
  | 'art'
  | 'music'
  | 'stories'
  | 'nature'
  | 'coding';

export type ApprovalStatus = 'approved' | 'pending' | 'blocked';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  interests: ContentCategory[];
  screenTimeMinutes: number;
  dailyLimitMinutes: number;
  isPaused: boolean;
  streakDays: number;
  badges: string[];
}

export interface Channel {
  id: string;
  name: string;
  thumbnail: string;
  subscriberCount: string;
  isFullyApproved: boolean;
  videoCount: number;
  category: ContentCategory;
}

export type ContentType = 'VIDEO' | 'SHORT';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  channelId: string;
  channelName: string;
  category: ContentCategory;
  contentType?: ContentType;
  streamUrl?: string | null;
  status: ApprovalStatus;
  views: string;
  publishedAt: string;
  isFavorite: boolean;
  watchProgress: number;
  captionUrl?: string;
}

export interface WatchActivity {
  id: string;
  childId: string;
  videoId: string;
  videoTitle: string;
  thumbnail: string;
  watchedAt: string;
  durationMinutes: number;
}

export interface DailyUsage {
  day: string;
  minutes: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'approval' | 'limit' | 'achievement' | 'system';
  read: boolean;
  createdAt: string;
}

export interface ParentUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  pinEnabled: boolean;
  biometricEnabled: boolean;
}

export interface AnalyticsSummary {
  totalWatchMinutes: number;
  approvedVideos: number;
  pendingApprovals: number;
  activeChildren: number;
  topCategory: ContentCategory;
  weeklyUsage: DailyUsage[];
}
