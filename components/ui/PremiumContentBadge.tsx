import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_GRADIENT_FULL } from '../../constants/branding';
import { radius } from '../../theme/colors';

type Props = {
  compact?: boolean;
  style?: ViewStyle;
};

export default function PremiumContentBadge({ compact, style }: Props) {
  return (
    <LinearGradient
      colors={BRAND_GRADIENT_FULL}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, compact && styles.badgeCompact, style]}
    >
      <Icon name="diamond" size={compact ? 10 : 11} color="#fff" />
      <Text style={[styles.text, compact && styles.textCompact]}>Premium</Text>
    </LinearGradient>
  );
}

export function PremiumLockOverlay({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={[styles.lockCircle, compact && styles.lockCircleCompact]}>
        <Icon name="lock-closed" size={compact ? 16 : 22} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  textCompact: {
    fontSize: 9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircleCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});
