import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { Channel } from '../../types';
import BadgePill from '../ui/BadgePill';

type Props = {
  channel: Channel;
  onPress?: () => void;
  onToggleApprove?: () => void;
};

export default function ChannelCard({ channel, onPress, onToggleApprove }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Image source={{ uri: channel.thumbnail }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {channel.name}
        </Text>
        <Text style={[styles.subs, { color: colors.textMuted }]}>
          {channel.subscriberCount} · {channel.videoCount} videos
        </Text>
        <BadgePill
          label={channel.isFullyApproved ? 'approved' : 'pending'}
          status={channel.isFullyApproved ? 'approved' : 'pending'}
        />
      </View>
      {onToggleApprove && (
        <Pressable onPress={onToggleApprove} style={styles.action}>
          <Icon
            name={channel.isFullyApproved ? 'checkmark-circle' : 'add-circle-outline'}
            size={28}
            color={channel.isFullyApproved ? colors.success : colors.primary}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.bodyBold,
  },
  subs: {
    ...typography.caption,
  },
  action: {
    padding: 4,
  },
});
