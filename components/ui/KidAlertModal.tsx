import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import {
  BRAND_CHILD_ACCENT,
  BRAND_CYAN,
  BRAND_GRADIENT,
  BRAND_GRADIENT_FULL,
} from '../../constants/branding';
import type { KidAlertButton, KidAlertConfig, KidAlertVariant } from '../../services/kidAlert';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  visible: boolean;
  config: KidAlertConfig | null;
  onDismiss: () => void;
};

type VariantMeta = {
  emoji: string;
  icon: string;
  gradient: [string, string, string];
  glow: string;
};

const VARIANT_META: Record<KidAlertVariant, VariantMeta> = {
  success: {
    emoji: '🎉',
    icon: 'star',
    gradient: ['#FFD93D', '#FF6B9D', BRAND_CYAN],
    glow: '#FFD93D',
  },
  error: {
    emoji: '😔',
    icon: 'heart-dislike',
    gradient: ['#FF6B6B', '#FF4DB8', '#FF8E8E'],
    glow: '#FF6B6B',
  },
  warning: {
    emoji: '🤔',
    icon: 'alert-circle',
    gradient: ['#FFD93D', '#F59E0B', '#FF9F43'],
    glow: '#F59E0B',
  },
  confirm: {
    emoji: '⭐',
    icon: 'help-circle',
    gradient: BRAND_GRADIENT_FULL,
    glow: BRAND_CHILD_ACCENT,
  },
  info: {
    emoji: '✨',
    icon: 'sparkles',
    gradient: BRAND_GRADIENT_FULL,
    glow: BRAND_CYAN,
  },
};

function Sparkle({ index }: { index: number }) {
  const drift = useSharedValue(0);
  const spin = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    const delay = index * 40;
    drift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    spin.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 2200, easing: Easing.linear }), -1, false),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0.4, { duration: 500 })),
        -1,
        true,
      ),
    );
  }, [drift, index, opacity, spin]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: drift.value }, { rotate: `${spin.value}deg` }],
  }));

  const positions = [
    { top: -8, left: 18 },
    { top: 12, right: 10 },
    { bottom: 24, left: 8 },
    { bottom: 8, right: 22 },
    { top: 40, left: -6 },
    { top: 28, right: -4 },
  ];
  const pos = positions[index % positions.length];

  return (
    <Animated.Text style={[styles.sparkle, pos, style]}>
      {index % 2 === 0 ? '✦' : '★'}
    </Animated.Text>
  );
}

function BouncyEmoji({ emoji, glow }: { emoji: string; glow: string }) {
  const bounce = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 320 });
    bounce.value = withDelay(
      120,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(4, { duration: 400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [bounce, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.emojiWrap, { shadowColor: glow }, style]}>
      <LinearGradient colors={BRAND_GRADIENT} style={styles.emojiRing}>
        <View style={styles.emojiInner}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function AlertButton({
  button,
  onPress,
  colors,
}: {
  button: KidAlertButton;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isCancel = button.style === 'cancel';
  const isDestructive = button.style === 'destructive';

  return (
    <Animated.View style={[styles.btnWrap, anim]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 18, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 400 });
        }}
        style={[
          styles.btn,
          isCancel && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5 },
          isDestructive && styles.btnDestructive,
          !isCancel && !isDestructive && styles.btnPrimary,
        ]}
      >
        {!isCancel && !isDestructive ? (
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : isDestructive ? (
          <LinearGradient
            colors={['#FF6B6B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <Text
          style={[
            styles.btnText,
            isCancel && { color: colors.textMuted },
            !isCancel && styles.btnTextLight,
          ]}
        >
          {button.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function KidAlertModal({ visible, config, onDismiss }: Props) {
  const { colors } = useTheme();
  const meta = useMemo(
    () => VARIANT_META[config?.variant ?? 'info'],
    [config?.variant],
  );

  if (!config) return null;

  const handleButton = (button: KidAlertButton) => {
    onDismiss();
    button.onPress?.();
  };

  const buttons = config.buttons ?? [{ text: 'OK' }];
  const stacked = buttons.length > 2;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(90)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <Animated.View
          entering={ZoomIn.springify().damping(20).stiffness(320)}
          exiting={ZoomOut.duration(100)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <LinearGradient
            colors={[`${meta.gradient[0]}33`, `${meta.gradient[2]}18`, 'transparent']}
            style={styles.cardGlow}
          />

          {Array.from({ length: 6 }).map((_, i) => (
            <Sparkle key={i} index={i} />
          ))}

          <BouncyEmoji emoji={meta.emoji} glow={meta.glow} />

          <View style={styles.iconBadge}>
            <LinearGradient colors={meta.gradient} style={styles.iconBadgeGradient}>
              <Icon name={meta.icon} size={16} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.text }, !config.message && styles.titleOnly]}>
            {config.title}
          </Text>
          {config.message ? (
            <Text style={[styles.message, { color: colors.textMuted }]}>{config.message}</Text>
          ) : null}

          <View style={[styles.btnRow, stacked && styles.btnRowStacked]}>
            {buttons.map((button, index) => (
              <AlertButton
                key={`${button.text}-${index}`}
                button={button}
                colors={colors}
                onPress={() => handleButton(button)}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl + 4,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl + 4,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    color: BRAND_CHILD_ACCENT,
    zIndex: 2,
  },
  emojiWrap: {
    marginTop: -52,
    marginBottom: spacing.sm,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  emojiRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
  },
  emojiInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 42,
    lineHeight: 48,
  },
  iconBadge: {
    position: 'absolute',
    top: spacing.lg + 4,
    right: spacing.lg,
  },
  iconBadgeGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  titleOnly: {
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  btnRowStacked: {
    flexDirection: 'column',
  },
  btnWrap: {
    flex: 1,
    minWidth: 0,
  },
  btn: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnPrimary: {},
  btnDestructive: {},
  btnText: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  btnTextLight: {
    color: '#fff',
  },
});
