import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import type { ChildChannel } from '../../utils/channelMapper';
import { BRAND_PRIMARY } from '../../constants/branding';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  channel: ChildChannel;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
};

/** Large channel tile for kid discover grid. */
export default function ChildKidChannelCard({
  channel,
  onPress,
  onFavorite,
  isFavorite = false,
}: Props) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const initial = channel.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[styles.wrap, style]}
      accessibilityRole="button"
      accessibilityLabel={channel.name}
    >
      <LinearGradient colors={['#9B7BFF', BRAND_PRIMARY]} style={styles.frame}>
        <View style={styles.inner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {channel.name}
          </Text>
          {onFavorite ? (
            <Pressable style={styles.heart} onPress={onFavorite} hitSlop={8}>
              <Icon name={isFavorite ? 'heart' : 'heart-outline'} size={20} color="#FF4DB8" />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '47%',
    marginBottom: 16,
  },
  frame: {
    borderRadius: 26,
    padding: 4,
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  inner: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#6A3FE8',
    padding: 14,
    minHeight: 148,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: BRAND_PRIMARY,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
