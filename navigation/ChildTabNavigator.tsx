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
import type { ChildTabParamList } from './types';

const Tab = createBottomTabNavigator<ChildTabParamList>();

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const style = useAnimatedStyle(
    () => ({
      transform: [{ scale: withSpring(focused ? 1.2 : 1) }],
    }),
    [focused],
  );

  return (
    <Animated.View style={style}>
      <Icon name={focused ? name : `${name}-outline`} size={26} color={color} />
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </Animated.View>
  );
}

export default function ChildTabNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tabBarStyle = useChildTabBarStyle(colors);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.childPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
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
