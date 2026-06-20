import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

export type DiscoverTab = 'videos' | 'shorts' | 'channels';

const TABS: { key: DiscoverTab; label: string; icon: string }[] = [
  { key: 'videos', label: 'Videos', icon: 'play-circle' },
  { key: 'shorts', label: 'Shorts', icon: 'flash' },
  { key: 'channels', label: 'Channels', icon: 'albums' },
];

type Props = {
  value: DiscoverTab;
  onChange: (tab: DiscoverTab) => void;
};

export default function DiscoverSegmentTabs({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.border + '44' }]}>
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.segment, active && { backgroundColor: colors.primary }]}
          >
            <Icon name={t.icon} size={15} color={active ? '#fff' : colors.textMuted} />
            <Text
              style={[styles.label, { color: active ? '#fff' : colors.textSecondary }]}
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
    borderRadius: radius.lg,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 6,
    borderRadius: radius.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 0,
  },
});
