import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<boolean>;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export default function ParentPinModal({ visible, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError(null);
    }
  }, [visible]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const triggerShake = () => {
    shake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const handleKey = async (key: string) => {
    if (submitting) return;

    if (key === 'del') {
      setPin((prev) => prev.slice(0, -1));
      setError(null);
      return;
    }
    if (!key || pin.length >= 4) return;

    const next = pin + key;
    setPin(next);
    setError(null);

    if (next.length === 4) {
      setSubmitting(true);
      const ok = await onSubmit(next);
      setSubmitting(false);
      if (ok) {
        setPin('');
        return;
      }
      setError(t('pin_incorrect'));
      setPin('');
      triggerShake();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={[styles.sheet, { backgroundColor: colors.card }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Icon name="lock-closed" size={28} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>{t('parent_pin')}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('enter_pin')}</Text>
            </View>

            <Animated.View style={[styles.dotsRow, shakeStyle]}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i < pin.length ? colors.primary : 'transparent',
                      borderColor: colors.primary,
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {error ? (
              <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
            ) : (
              <View style={styles.errorSpacer} />
            )}

            <View style={styles.keypad}>
              {KEYS.map((key, index) => {
                if (key === '') {
                  return <View key={`spacer-${index}`} style={styles.key} />;
                }
                return (
                  <Pressable
                    key={key === 'del' ? 'delete' : key}
                    style={[styles.key, { backgroundColor: colors.surface }]}
                    onPress={() => void handleKey(key)}
                  >
                    {key === 'del' ? (
                      <Icon name="backspace-outline" size={24} color={colors.text} />
                    ) : (
                      <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>{t('cancel')}</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, textAlign: 'center' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  error: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSpacer: { height: 20, marginBottom: spacing.sm },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  key: {
    width: '30%',
    maxWidth: 96,
    aspectRatio: 1.4,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { ...typography.h2, fontSize: 24 },
  cancelBtn: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cancelText: { ...typography.bodyBold },
});
