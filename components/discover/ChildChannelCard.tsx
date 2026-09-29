import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/colors';
import type { ChildChannel } from '../../utils/channelMapper';
import CachedImage from '../ui/CachedImage';
import { childTapHaptic } from '../../utils/childHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  channel: ChildChannel;
  onPress: () => void;
  compact?: boolean;
  onFavorite?: () => void;
  isFavorite?: boolean;
};

/** Compact channel rail — clean circle, light ring. */
function ChildChannelCard({
  channel,
  onPress,
  compact = false,
  onFavorite,
  isFavorite = false,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (compact) {
    return (
      <AnimatedPressable
        onPress={() => {
          childTapHaptic('tap');
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 16, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        }}
        style={[styles.rail, animatedStyle]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${channel.name} channel`}
      >
        <View style={[styles.railRing, { borderColor: colors.primary + '35' }]}>
          {channel.thumbnail ? (
            <CachedImage uri={channel.thumbnail} style={styles.railAvatar} />
          ) : (
            <View style={[styles.railAvatar, styles.railFallback, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.railFallbackText, { color: colors.primary }]}>
                {channel.name.trim().charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.railNameSlot}>
          <Text style={[styles.railName, { color: colors.text }]} numberOfLines={2}>
            {channel.name}
          </Text>
        </View>
        {onFavorite ? (
          <Pressable
            style={styles.railHeart}
            onPress={() => {
              childTapHaptic('select');
              onFavorite();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? `Unfavorite ${channel.name}` : `Favorite ${channel.name}`
            }
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavorite ? colors.accent : colors.textMuted}
            />
          </Pressable>
        ) : null}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={() => {
        childTapHaptic('tap');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={channel.name}
    >
      <View style={styles.row}>
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
          <Pressable
            style={styles.heartBtn}
            onPress={() => {
              childTapHaptic('select');
              onFavorite();
            }}
            hitSlop={8}
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.accent : colors.textMuted}
            />
          </Pressable>
        ) : (
          <Icon name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 84,
    marginRight: 12,
    alignItems: 'center',
  },
  railRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
    overflow: 'hidden',
  },
  railAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  railFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  railFallbackText: {
    fontSize: 22,
    fontWeight: '800',
  },
  railNameSlot: {
    marginTop: 8,
    minHeight: 30,
    width: '100%',
    justifyContent: 'flex-start',
  },
  railName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  railHeart: {
    marginTop: 2,
    padding: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(ChildChannelCard);
