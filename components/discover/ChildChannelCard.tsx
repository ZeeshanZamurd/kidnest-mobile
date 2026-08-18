import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { ChildChannel } from '../../utils/channelMapper';
import CachedImage from '../ui/CachedImage';

type Props = {
  channel: ChildChannel;
  onPress: () => void;
  compact?: boolean;
  onFavorite?: () => void;
  isFavorite?: boolean;
};

function ChildChannelCard({
  channel,
  onPress,
  compact = false,
  onFavorite,
  isFavorite = false,
}: Props) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <CachedImage uri={channel.thumbnail} style={styles.compactAvatar} />
        <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={2}>
          {channel.name}
        </Text>
        {onFavorite ? (
          <Pressable style={styles.compactHeart} onPress={onFavorite} hitSlop={8}>
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? colors.accent : colors.textMuted}
            />
          </Pressable>
        ) : null}
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
        <CachedImage uri={channel.thumbnail} style={styles.avatar} />
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
        {onFavorite ? (
          <Pressable style={styles.heartBtn} onPress={onFavorite} hitSlop={8}>
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? colors.accent : colors.textMuted}
            />
          </Pressable>
        ) : (
          <Icon name="chevron-forward" size={20} color={colors.textMuted} />
        )}
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
  compactHeart: {
    marginTop: 2,
  },
  heartBtn: {
    padding: 4,
  },
});

export default memo(ChildChannelCard);
