import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import ParentDashboardScreen from '../screens/Parent/ParentDashboardScreen';
import ContentDiscoveryScreen from '../screens/Parent/ContentDiscoveryScreen';
import ChildProfilesScreen from '../screens/Parent/ChildProfilesScreen';
import SettingsScreen from '../screens/Shared/SettingsScreen';
import { useTheme } from '../context/ThemeContext';
import { useParentBootstrap } from '../hooks/useParentBootstrap';
import { useParentTabBarStyle } from './tabBarOptions';
import type { ParentTabParamList } from './types';

const Tab = createBottomTabNavigator<ParentTabParamList>();

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const style = useAnimatedStyle(
    () => ({
      transform: [{ scale: withSpring(focused ? 1.15 : 1) }],
    }),
    [focused],
  );

  return (
    <Animated.View style={style}>
      <Icon name={focused ? name : `${name}-outline`} size={24} color={color} />
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </Animated.View>
  );
}

export default function ParentTabNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  useParentBootstrap();
  const tabBarStyle = useParentTabBarStyle(colors);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ParentDashboardScreen}
        options={{
          tabBarLabel: t('dashboard'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="grid" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={ContentDiscoveryScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="compass" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profiles"
        component={ChildProfilesScreen}
        options={{
          tabBarLabel: t('profiles'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="people" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 4,
  },
});
