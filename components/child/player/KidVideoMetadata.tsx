import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  BRAND_ACCENT,
  BRAND_CHILD_ACCENT,
  BRAND_CYAN,
  BRAND_PRIMARY,
} from '../../../constants/branding';
import { spacing, typography } from '../../../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ActionCardProps = {
  emoji: string;
  label: string;
  active: boolean;
  gradient: [string, string];
  glow: string;
  onPress: () => void;
};

function ActionCard({ emoji, label, active, gradient, glow, onPress }: ActionCardProps) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 12, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.05, { damping: 8, stiffness: 220 }, () => {
          scale.value = withSpring(1);
        });
      }}
      style={[styles.actionCardWrap, anim]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={gradient}
        style={[styles.actionCard, active && { borderColor: glow, borderWidth: 4 }]}
      >
        <Text style={styles.actionEmoji}>{emoji}</Text>
        <Text style={styles.actionLabel} numberOfLines={1}>
          {label}
        </Text>
        {active ? (
          <View style={[styles.activeDot, { backgroundColor: glow }]}>
            <Icon name="checkmark" size={14} color="#fff" />
          </View>
        ) : null}
      </LinearGradient>
    </AnimatedPressable>
  );
}

type Props = {
  title: string;
  channelName: string;
  isFavorite: boolean;
  isChannelFavorite: boolean;
  channelNavigable: boolean;
  showFavorites: boolean;
  favoritesLabel: string;
  channelLabel: string;
  visitChannelLabel: string;
  onToggleFavorite: () => void;
  onToggleChannel: () => void;
  onOpenChannel: () => void;
};

export default function KidVideoMetadata({
  title,
  channelName,
  isFavorite,
  isChannelFavorite,
  channelNavigable,
  showFavorites,
  favoritesLabel,
  channelLabel,
  visitChannelLabel,
  onToggleFavorite,
  onToggleChannel,
  onOpenChannel,
}: Props) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#F3EEFF', '#E8DEFF', '#FDF4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.titleCard}
      >
        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>
        <View style={styles.channelChip}>
          <Icon name="planet-outline" size={18} color={BRAND_PRIMARY} />
          <Text style={styles.channelName} numberOfLines={1}>
            {channelName}
          </Text>
        </View>
      </LinearGradient>

      {showFavorites ? (
        <View style={styles.actionRow}>
          <ActionCard
            emoji="💖"
            label={favoritesLabel}
            active={isFavorite}
            gradient={isFavorite ? ['#FF7DC8', BRAND_ACCENT] : ['#FFD6EC', '#FFB8E0']}
            glow={BRAND_ACCENT}
            onPress={onToggleFavorite}
          />
          <ActionCard
            emoji="⭐"
            label={channelLabel}
            active={isChannelFavorite}
            gradient={isChannelFavorite ? ['#FFE566', BRAND_CHILD_ACCENT] : ['#FFF3C4', '#FFE999']}
            glow={BRAND_CHILD_ACCENT}
            onPress={onToggleChannel}
          />
        </View>
      ) : null}

      {channelNavigable ? (
        <Pressable onPress={onOpenChannel} style={styles.visitBtn}>
          <LinearGradient
            colors={[BRAND_CYAN, '#3DD4EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.visitGradient}
          >
            <Icon name="rocket-outline" size={28} color="#fff" />
            <Text style={styles.visitText}>{visitChannelLabel}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  titleCard: {
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: 'rgba(123, 77, 255, 0.22)',
    shadowColor: BRAND_PRIMARY,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3D2A7A',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(123, 77, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  channelName: {
    ...typography.bodyBold,
    color: BRAND_PRIMARY,
    maxWidth: 240,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCardWrap: {
    flex: 1,
  },
  actionCard: {
    borderRadius: 24,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    minHeight: 110,
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  actionEmoji: {
    fontSize: 36,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3D2A7A',
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  visitBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: BRAND_CYAN,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  visitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  visitText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
});
