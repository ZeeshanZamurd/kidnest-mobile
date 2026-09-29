import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import ChildHomeScreen from '../screens/Child/ChildHomeScreen';
import VideoFeedScreen from '../screens/Child/VideoFeedScreen';
import ChildWatchHistoryScreen from '../screens/Child/ChildWatchHistoryScreen';
import FavoritesScreen from '../screens/Shared/FavoritesScreen';
import { useTheme } from '../context/ThemeContext';
import { useChildTabBarStyle } from './tabBarOptions';
import { useChildFavorites } from '../hooks/useChildFavorites';
import { useAppBlockEnforcement } from '../hooks/useAppBlockEnforcement';
import { useAppStore } from '../store/useAppStore';
import { childTapHaptic } from '../utils/childHaptics';
import type { ChildTabParamList } from './types';

const Tab = createBottomTabNavigator<ChildTabParamList>();

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const style = useAnimatedStyle(
    () => ({
      transform: [{ scale: withSpring(focused ? 1.22 : 1, { damping: 14, stiffness: 220 }) }],
    }),
    [focused],
  );

  return (
    <Animated.View style={style}>
      <Icon name={focused ? name : `${name}-outline`} size={28} color={color} />
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </Animated.View>
  );
}

export default function ChildTabNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const activeChildId = useAppStore((s) => s.activeChildId);
  useChildFavorites(activeChildId);
  useAppBlockEnforcement();
  const tabBarStyle = useChildTabBarStyle(colors);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.childPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          ...tabBarStyle,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          overflow: 'hidden',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '800' },
        tabBarHideOnKeyboard: true,
      }}
      screenListeners={{
        tabPress: () => {
          childTapHaptic('select');
        },
      }}
    >
      <Tab.Screen
        name="ChildHome"
        component={ChildHomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: t('home'),
        }}
      />
      <Tab.Screen
        name="ChildFeed"
        component={VideoFeedScreen}
        options={{
          tabBarLabel: t('feed'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="play" focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: t('feed'),
        }}
      />
      <Tab.Screen
        name="ChildHistory"
        component={ChildWatchHistoryScreen}
        options={{
          tabBarLabel: t('history'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="time" focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: t('history'),
        }}
      />
      <Tab.Screen
        name="ChildFavorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: t('favorites'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="heart" focused={focused} color={color} />
          ),
          tabBarAccessibilityLabel: t('favorites'),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 4,
  },
});
