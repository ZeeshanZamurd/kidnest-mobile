import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  ProfileSelection: undefined;
  ParentTabs: NavigatorScreenParams<ParentTabParamList> | undefined;
  ChildTabs: NavigatorScreenParams<ChildTabParamList> | undefined;
  VideoPlayer: { videoId: string };
  ChannelDetail: { channelId: string };
  ChildChannelDetail: { channelId: string };
  AddVideo: undefined;
  AddChild: undefined;
  ChildProfiles: undefined;
  ChildProfileDetail: { childId: string };
  WatchHistory: undefined;
  Favorites: undefined;
  Analytics: undefined;
  Notifications: undefined;
  Search: undefined;
  ParentLibrary: undefined;
  Subscription: undefined;
  AppBlocking: undefined;
};

export type ParentTabParamList = {
  Dashboard: undefined;
  Discover: undefined;
  Profiles: undefined;
  Settings: undefined;
};

export type ChildTabParamList = {
  ChildHome: undefined;
  ChildFeed: { videoId?: string; channelId?: string } | undefined;
  ChildHistory: undefined;
  ChildFavorites: undefined;
};
