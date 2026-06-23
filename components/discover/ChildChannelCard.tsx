import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { ChildChannel } from '../../utils/channelMapper';

type Props = {
  channel: ChildChannel;
  onPress: () => void;
  compact?: boolean;
};

export default function ChildChannelCard({ channel, onPress, compact = false }: Props) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Image source={{ uri: channel.thumbnail }} style={styles.compactAvatar} />
        <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={2}>
          {channel.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <LinearGradient
        colors={[colors.childPrimary + '22', colors.accent + '12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Image source={{ uri: channel.thumbnail }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.categoryName ? (
            <Text style={[styles.category, { color: colors.textMuted }]} numberOfLines={1}>
              {channel.categoryName}
            </Text>
          ) : null}
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textMuted} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  category: {
    ...typography.caption,
  },
  compact: {
    width: 108,
    marginRight: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactAvatar: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  compactName: {
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 34,
  },
});
