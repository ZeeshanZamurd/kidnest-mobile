import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

export type DiscoverTab = 'home' | 'videos' | 'shorts' | 'channels';

const TABS: { key: DiscoverTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline' },
  { key: 'videos', label: 'Videos', icon: 'play-circle-outline' },
  { key: 'shorts', label: 'Shorts', icon: 'flash-outline' },
  { key: 'channels', label: 'Channels', icon: 'albums-outline' },
];

type Props = {
  value: DiscoverTab;
  onChange: (tab: DiscoverTab) => void;
};

/** Equal-width segmented control — soft rectangle track, not oversized pills. */
export default function DiscoverSegmentTabs({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              active && {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Icon
              name={t.icon}
              size={15}
              color={active ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                { color: active ? '#FFFFFF' : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
    height: 40,
    padding: 3,
    gap: 2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: radius.sm,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
