import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import ProfileAvatar from './ProfileAvatar';
import { getChildProfileMeta } from '../../services/childProfileMetaStorage';
import type { ParentChild } from '../../api/parent';
import type { AvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type ChildOption = {
  id: string;
  name: string;
  avatarKey: AvatarKey;
  isPaused: boolean;
};

type Props = {
  visible: boolean;
  children: ParentChild[];
  loading?: boolean;
  onClose: () => void;
  onSelect: (childId: string) => void;
  title?: string;
};

export default function ChildProfilePickerModal({
  visible,
  children,
  loading,
  onClose,
  onSelect,
  title,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [options, setOptions] = useState<ChildOption[]>([]);

  useEffect(() => {
    if (!visible || children.length === 0) {
      setOptions([]);
      return;
    }
    void Promise.all(
      children.map(async (child, index) => {
        const meta = await getChildProfileMeta(child.id, index);
        return {
          id: child.id,
          name: child.user.displayName,
          avatarKey: meta.avatarKey,
          isPaused: child.isPaused,
        };
      }),
    ).then(setOptions);
  }, [visible, children]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(160)}
          style={[styles.sheet, { backgroundColor: colors.card }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.title, { color: colors.text }]}>
              {title ?? t('assign_pick_child')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t('assign_pick_child_desc')}
            </Text>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : options.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>{t('no_children')}</Text>
            ) : (
              <ScrollView
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
              >
                {options.map((option) => (
                  <Pressable
                    key={option.id}
                    disabled={option.isPaused}
                    onPress={() => onSelect(option.id)}
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        opacity: option.isPaused ? 0.45 : 1,
                      },
                    ]}
                  >
                    <ProfileAvatar avatarKey={option.avatarKey} size={64} />
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      {option.name}
                    </Text>
                    {option.isPaused ? (
                      <Text style={[styles.paused, { color: colors.warning }]}>
                        {t('profile_paused')}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Pressable onPress={onClose} style={styles.cancel}>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  title: { ...typography.h2, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.caption, textAlign: 'center', marginBottom: spacing.lg },
  loader: { marginVertical: spacing.xl },
  empty: { ...typography.body, textAlign: 'center', marginVertical: spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  card: {
    width: '28%',
    minWidth: 96,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  name: { ...typography.caption, fontWeight: '600', textAlign: 'center' },
  paused: { ...typography.tiny },
  cancel: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  cancelText: { ...typography.bodyBold },
});
