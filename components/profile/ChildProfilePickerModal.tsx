import React, { useEffect, useMemo, useState } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ProfileAvatar from './ProfileAvatar';
import { loadChildProfileMetaMap } from '../../services/childProfileMetaStorage';
import type { ParentChild } from '../../api/parent';
import { avatarKeyForIndex, isAvatarKey, type AvatarKey } from '../../constants/avatars';
import { BRAND_GRADIENT_FULL } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
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
  assigningChildId?: string | null;
  activeChildId?: string | null;
  selectOnly?: boolean;
  onClose: () => void;
  onSelect: (childId: string) => void;
  title?: string;
};

function toOptions(children: ParentChild[], metaMap?: Record<string, { avatarKey?: string }>): ChildOption[] {
  return children.map((child, index) => {
    const stored = metaMap?.[child.id]?.avatarKey;
    const avatarKey =
      stored && isAvatarKey(stored) ? stored : avatarKeyForIndex(index);
    return {
      id: child.id,
      name: child.user.displayName,
      avatarKey,
      isPaused: child.isPaused,
    };
  });
}

function ChildPickerRow({
  option,
  selected,
  assigning,
  disabled,
  selectOnly,
  onPress,
}: {
  option: ChildOption;
  selected: boolean;
  assigning: boolean;
  disabled: boolean;
  selectOnly?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      disabled={disabled || assigning}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? colors.primary + '14' : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <ProfileAvatar avatarKey={option.avatarKey} size={48} />
      <View style={styles.rowMeta}>
        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
          {option.name}
        </Text>
        {option.isPaused ? (
          <Text style={[styles.rowSub, { color: colors.warning }]}>{t('profile_paused')}</Text>
        ) : (
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            {selected
              ? t('assign_active_child', 'Active profile')
              : selectOnly
                ? t('assign_tap_to_select', 'Tap to select')
                : t('assign_tap_to_add', 'Tap to assign')}
          </Text>
        )}
      </View>
      {assigning ? (
        <ActivityIndicator color={colors.primary} />
      ) : selected ? (
        <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
          <Icon name="checkmark" size={16} color="#fff" />
        </View>
      ) : selectOnly ? (
        <Icon name="ellipse-outline" size={22} color={colors.textMuted} />
      ) : (
        <Icon name="add-circle-outline" size={24} color={colors.primary} />
      )}
    </Pressable>
  );
}

export default function ChildProfilePickerModal({
  visible,
  children,
  loading,
  assigningChildId,
  activeChildId,
  selectOnly,
  onClose,
  onSelect,
  title,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { bottom } = useAppInsets();
  const [metaMap, setMetaMap] = useState<Record<string, { avatarKey?: string }>>({});

  useEffect(() => {
    if (children.length === 0) return;
    void loadChildProfileMetaMap().then(setMetaMap);
  }, [children]);

  const options = useMemo(() => toOptions(children, metaMap), [children, metaMap]);
  const isAssigning = Boolean(assigningChildId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isAssigning ? undefined : onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isAssigning ? undefined : onClose}
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: bottom + spacing.md,
              shadowColor: colors.text,
            },
          ]}
        >
          <LinearGradient colors={BRAND_GRADIENT_FULL} style={styles.headerStripe} />

          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primary + '18' }]}>
                <Icon name="people" size={20} color={colors.primary} />
              </View>
              <Pressable
                disabled={isAssigning}
                onPress={onClose}
                hitSlop={12}
                style={[styles.closeBtn, { opacity: isAssigning ? 0.4 : 1 }]}
              >
                <Icon name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {title ?? (selectOnly ? t('assign_select_child') : t('assign_pick_child'))}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {selectOnly ? t('assign_select_child_desc', 'Choose who receives new content.') : t('assign_pick_child_desc')}
            </Text>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.stateText, { color: colors.textMuted }]}>
                {t('assign_loading_children', 'Loading profiles…')}
              </Text>
            </View>
          ) : options.length === 0 ? (
            <View style={styles.centerState}>
              <Icon name="person-add-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.stateText, { color: colors.textMuted }]}>{t('no_children')}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              bounces={options.length > 4}
            >
              {options.map((option) => (
                <ChildPickerRow
                  key={option.id}
                  option={option}
                  selected={option.id === activeChildId}
                  assigning={assigningChildId === option.id}
                  disabled={option.isPaused || isAssigning}
                  selectOnly={selectOnly}
                  onPress={() => onSelect(option.id)}
                />
              ))}
            </ScrollView>
          )}

          <Pressable
            disabled={isAssigning}
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: isAssigning ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: 220,
    maxHeight: '72%',
    elevation: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  headerStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
  },
  header: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h2, fontSize: 20 },
  subtitle: { ...typography.caption, lineHeight: 18 },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  stateText: { ...typography.body, textAlign: 'center' },
  listScroll: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  rowMeta: { flex: 1, gap: 2, minWidth: 0 },
  rowName: { ...typography.bodyBold, fontSize: 16 },
  rowSub: { ...typography.caption },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  cancelText: { ...typography.bodyBold },
});
