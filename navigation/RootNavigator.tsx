import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import AuthScreen from '../screens/Auth/AuthScreen';
import RoleSelectionScreen from '../screens/Auth/RoleSelectionScreen';
import ParentTabNavigator from './ParentTabNavigator';
import ChildTabNavigator from './ChildTabNavigator';
import VideoPlayerScreen from '../screens/Shared/VideoPlayerScreen';
import AddVideoScreen from '../screens/Parent/AddVideoScreen';
import ChildProfilesScreen from '../screens/Parent/ChildProfilesScreen';
import WatchHistoryScreen from '../screens/Shared/WatchHistoryScreen';
import FavoritesScreen from '../screens/Shared/FavoritesScreen';
import AnalyticsScreen from '../screens/Parent/AnalyticsScreen';
import NotificationsScreen from '../screens/Shared/NotificationsScreen';
import SearchScreen from '../screens/Parent/SearchScreen';
import ParentLibraryScreen from '../screens/Parent/ParentLibraryScreen';
import SubscriptionScreen from '../screens/Parent/SubscriptionScreen';
import ChannelDetailScreen from '../screens/Parent/ChannelDetailScreen';
import { useAppStore } from '../store/useAppStore';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function OnboardingRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  return (
    <OnboardingScreen
      onComplete={() => {
        setOnboarded(true);
        navigation.replace('Auth');
      }}
    />
  );
}

export default function RootNavigator() {
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const parentSession = useAppStore((s) => s.parentSession);
  const role = useAppStore((s) => s.role);

  const initialRoute = !hasOnboarded
    ? 'Onboarding'
    : !isAuthenticated || !parentSession
      ? 'Auth'
      : !role
        ? 'RoleSelection'
        : role === 'child'
          ? 'ChildTabs'
          : 'ParentTabs';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingRoute} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />
      <Stack.Screen name="ChildTabs" component={ChildTabNavigator} />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="AddVideo" component={AddVideoScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ChildProfiles" component={ChildProfilesScreen} />
      <Stack.Screen name="WatchHistory" component={WatchHistoryScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ParentLibrary" component={ParentLibraryScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen
        name="ChannelDetail"
        component={ChannelDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
