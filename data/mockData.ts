import type {
  AnalyticsSummary,
  AppNotification,
  Channel,
  ChildProfile,
  ParentUser,
  Video,
  WatchActivity,
} from '../types';

/** Curated placeholder imagery — swap with CDN assets in production. */
const img = (seed: string, w = 640, h = 360) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const MOCK_PARENT: ParentUser = {
  id: 'parent-1',
  name: 'Sarah Mitchell',
  email: 'sarah@kidnest.app',
  avatar: img('parent-sarah', 200, 200),
  pinEnabled: true,
  biometricEnabled: true,
};

export const MOCK_CHILDREN: ChildProfile[] = [
  {
    id: 'child-1',
    name: 'Ahmed',
    age: 6,
    avatar: 'lion',
    interests: ['science', 'stories', 'art'],
    screenTimeMinutes: 42,
    dailyLimitMinutes: 60,
    isPaused: false,
    streakDays: 12,
    badges: ['star_learner', 'story_explorer'],
  },
  {
    id: 'child-2',
    name: 'Fatima',
    age: 9,
    avatar: 'panda',
    interests: ['coding', 'math', 'nature'],
    screenTimeMinutes: 28,
    dailyLimitMinutes: 90,
    isPaused: false,
    streakDays: 5,
    badges: ['math_wizard'],
  },
  {
    id: 'child-3',
    name: 'Ali',
    age: 4,
    avatar: 'fox',
    interests: ['music', 'art', 'stories'],
    screenTimeMinutes: 15,
    dailyLimitMinutes: 45,
    isPaused: true,
    streakDays: 3,
    badges: ['creative_spark'],
  },
];

export const MOCK_CHANNELS: Channel[] = [
  {
    id: 'ch-1',
    name: 'Cosmic Kids Lab',
    thumbnail: img('channel-cosmic', 400, 400),
    subscriberCount: '2.4M',
    isFullyApproved: true,
    videoCount: 128,
    category: 'science',
  },
  {
    id: 'ch-2',
    name: 'Number Ninjas',
    thumbnail: img('channel-math', 400, 400),
    subscriberCount: '890K',
    isFullyApproved: true,
    videoCount: 76,
    category: 'math',
  },
  {
    id: 'ch-3',
    name: 'Storybook Galaxy',
    thumbnail: img('channel-stories', 400, 400),
    subscriberCount: '1.1M',
    isFullyApproved: false,
    videoCount: 54,
    category: 'stories',
  },
  {
    id: 'ch-4',
    name: 'Code Cubs',
    thumbnail: img('channel-code', 400, 400),
    subscriberCount: '450K',
    isFullyApproved: true,
    videoCount: 42,
    category: 'coding',
  },
  {
    id: 'ch-5',
    name: 'Nature Explorers',
    thumbnail: img('channel-nature', 400, 400),
    subscriberCount: '3.2M',
    isFullyApproved: false,
    videoCount: 210,
    category: 'nature',
  },
];

export const MOCK_VIDEOS: Video[] = [
  {
    id: 'vid-1',
    title: 'Why Do Stars Twinkle? ✨',
    thumbnail: img('vid-stars', 720, 1280),
    duration: '8:24',
    durationSeconds: 504,
    channelId: 'ch-1',
    channelName: 'Cosmic Kids Lab',
    category: 'science',
    status: 'approved',
    views: '1.2M',
    publishedAt: '2025-03-12',
    isFavorite: true,
    watchProgress: 0.65,
  },
  {
    id: 'vid-2',
    title: 'Counting to 100 with Dinosaurs 🦕',
    thumbnail: img('vid-dino', 720, 1280),
    duration: '12:10',
    durationSeconds: 730,
    channelId: 'ch-2',
    channelName: 'Number Ninjas',
    category: 'math',
    status: 'approved',
    views: '890K',
    publishedAt: '2025-04-02',
    isFavorite: false,
    watchProgress: 0.2,
  },
  {
    id: 'vid-3',
    title: 'The Brave Little Rocket Ship 🚀',
    thumbnail: img('vid-rocket', 720, 1280),
    duration: '6:45',
    durationSeconds: 405,
    channelId: 'ch-3',
    channelName: 'Storybook Galaxy',
    category: 'stories',
    status: 'pending',
    views: '—',
    publishedAt: '2025-05-18',
    isFavorite: false,
    watchProgress: 0,
  },
  {
    id: 'vid-4',
    title: 'Build Your First Animation Block',
    thumbnail: img('vid-code', 720, 1280),
    duration: '15:30',
    durationSeconds: 930,
    channelId: 'ch-4',
    channelName: 'Code Cubs',
    category: 'coding',
    status: 'approved',
    views: '320K',
    publishedAt: '2025-02-28',
    isFavorite: true,
    watchProgress: 0.9,
  },
  {
    id: 'vid-5',
    title: 'Rainforest Animals Up Close',
    thumbnail: img('vid-rainforest', 720, 1280),
    duration: '9:12',
    durationSeconds: 552,
    channelId: 'ch-5',
    channelName: 'Nature Explorers',
    category: 'nature',
    status: 'pending',
    views: '—',
    publishedAt: '2025-05-20',
    isFavorite: false,
    watchProgress: 0,
  },
  {
    id: 'vid-6',
    title: 'Paint Like Picasso — Fun Shapes!',
    thumbnail: img('vid-art', 720, 1280),
    duration: '7:55',
    durationSeconds: 475,
    channelId: 'ch-1',
    channelName: 'Cosmic Kids Lab',
    category: 'art',
    status: 'approved',
    views: '540K',
    publishedAt: '2025-01-15',
    isFavorite: false,
    watchProgress: 0,
  },
  {
    id: 'vid-7',
    title: 'Piano Basics: Do-Re-Mi Adventure',
    thumbnail: img('vid-music', 720, 1280),
    duration: '11:00',
    durationSeconds: 660,
    channelId: 'ch-2',
    channelName: 'Number Ninjas',
    category: 'music',
    status: 'approved',
    views: '210K',
    publishedAt: '2025-03-30',
    isFavorite: true,
    watchProgress: 0.45,
  },
  {
    id: 'vid-8',
    title: 'Volcano Science — Safe Home Demo',
    thumbnail: img('vid-volcano', 720, 1280),
    duration: '5:40',
    durationSeconds: 340,
    channelId: 'ch-1',
    channelName: 'Cosmic Kids Lab',
    category: 'science',
    status: 'blocked',
    views: '—',
    publishedAt: '2025-04-10',
    isFavorite: false,
    watchProgress: 0,
  },
];

export const MOCK_WATCH_HISTORY: WatchActivity[] = [
  {
    id: 'wh-1',
    childId: 'child-1',
    videoId: 'vid-1',
    videoTitle: 'Why Do Stars Twinkle? ✨',
    thumbnail: img('vid-stars', 320, 180),
    watchedAt: '2025-06-10T16:30:00Z',
    durationMinutes: 8,
  },
  {
    id: 'wh-2',
    childId: 'child-1',
    videoId: 'vid-2',
    videoTitle: 'Counting to 100 with Dinosaurs 🦕',
    thumbnail: img('vid-dino', 320, 180),
    watchedAt: '2025-06-10T14:15:00Z',
    durationMinutes: 12,
  },
  {
    id: 'wh-3',
    childId: 'child-2',
    videoId: 'vid-4',
    videoTitle: 'Build Your First Animation Block',
    thumbnail: img('vid-code', 320, 180),
    watchedAt: '2025-06-09T18:00:00Z',
    durationMinutes: 15,
  },
  {
    id: 'wh-4',
    childId: 'child-2',
    videoId: 'vid-7',
    videoTitle: 'Piano Basics: Do-Re-Mi Adventure',
    thumbnail: img('vid-music', 320, 180),
    watchedAt: '2025-06-09T11:20:00Z',
    durationMinutes: 11,
  },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New video pending approval',
    body: '“The Brave Little Rocket Ship” is waiting for your review.',
    type: 'approval',
    read: false,
    createdAt: '2025-06-11T09:00:00Z',
  },
  {
    id: 'notif-2',
    title: 'Emma earned a badge!',
    body: 'Story Explorer — 10 stories completed this week.',
    type: 'achievement',
    read: false,
    createdAt: '2025-06-10T20:30:00Z',
  },
  {
    id: 'notif-3',
    title: 'Screen time limit approaching',
    body: 'Noah has 12 minutes left today.',
    type: 'limit',
    read: true,
    createdAt: '2025-06-10T17:45:00Z',
  },
  {
    id: 'notif-4',
    title: 'Channel sync complete',
    body: '3 new videos from Cosmic Kids Lab are ready to review.',
    type: 'system',
    read: true,
    createdAt: '2025-06-09T08:00:00Z',
  },
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  totalWatchMinutes: 847,
  approvedVideos: 42,
  pendingApprovals: 5,
  activeChildren: 2,
  topCategory: 'science',
  weeklyUsage: [
    { day: 'Mon', minutes: 95 },
    { day: 'Tue', minutes: 120 },
    { day: 'Wed', minutes: 88 },
    { day: 'Thu', minutes: 142 },
    { day: 'Fri', minutes: 110 },
    { day: 'Sat', minutes: 165 },
    { day: 'Sun', minutes: 127 },
  ],
};

export const CATEGORY_LABELS: Record<string, string> = {
  science: 'Science',
  math: 'Math',
  art: 'Art',
  music: 'Music',
  stories: 'Stories',
  nature: 'Nature',
  coding: 'Coding',
};

export const BADGE_LABELS: Record<string, string> = {
  star_learner: 'Star Learner',
  story_explorer: 'Story Explorer',
  math_wizard: 'Math Wizard',
  creative_spark: 'Creative Spark',
};

/** Approved videos only — child-safe feed source. */
export const getApprovedVideos = (): Video[] =>
  MOCK_VIDEOS.filter((v) => v.status === 'approved');

export const getPendingVideos = (): Video[] =>
  MOCK_VIDEOS.filter((v) => v.status === 'pending');

export const getVideosByChild = (childId: string): Video[] => {
  const child = MOCK_CHILDREN.find((c) => c.id === childId);
  if (!child) return getApprovedVideos();
  return getApprovedVideos().filter((v) => child.interests.includes(v.category));
};

export const getContinueWatching = (): Video[] =>
  getApprovedVideos()
    .filter((v) => v.watchProgress > 0 && v.watchProgress < 1)
    .sort((a, b) => b.watchProgress - a.watchProgress);

export const getFavorites = (): Video[] =>
  getApprovedVideos().filter((v) => v.isFavorite);
