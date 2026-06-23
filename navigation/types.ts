export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  ProfileSelection: undefined;
  ParentTabs: undefined;
  ChildTabs: undefined;
  VideoPlayer: { videoId: string };
  ChannelDetail: { channelId: string };
  ChildChannelDetail: { channelId: string };
  AddVideo: undefined;
  AddChild: undefined;
  ChildProfiles: undefined;
  WatchHistory: undefined;
  Favorites: undefined;
  Analytics: undefined;
  Notifications: undefined;
  Search: undefined;
  ParentLibrary: undefined;
  Subscription: undefined;
};

export type ParentTabParamList = {
  Dashboard: undefined;
  Discover: undefined;
  Profiles: undefined;
  Settings: undefined;
};

export type ChildTabParamList = {
  ChildHome: undefined;
  ChildFeed: undefined;
  ChildHistory: undefined;
  ChildFavorites: undefined;
};
