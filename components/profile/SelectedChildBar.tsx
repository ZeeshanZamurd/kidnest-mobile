import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import ProfileAvatar from './ProfileAvatar';
import {
  getChildProfileMeta,
  loadChildProfileMetaMap,
} from '../../services/childProfileMetaStorage';
import type { ParentChild } from '../../api/parent';
import { avatarKeyForIndex, isAvatarKey, type AvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

type Props = {
  children: ParentChild[];
  activeChildId: string | null;
  /** Instant switch (preferred for multi-child). */
  onSelectChild: (childId: string) => void;
  /** Opens full profile sheet (optional). */
  onOpenPicker?: () => void;
  /** Compact = single row chip; default = full-width global bar. */
  compact?: boolean;
};

/**
 * Global active-child switcher for parents.
 * Multi-child: horizontal avatars with live selection.
 * Single child: compact context bar.
 */
export default function SelectedChildBar({
  children,
  activeChildId,
  onSelectChild,
  onOpenPicker,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [metaMap, setMetaMap] = useState<Record<string, { avatarKey?: string }>>({});

  const active = children.find((c) => c.id === activeChildId) ?? children[0] ?? null;
  const multi = children.length > 1;

  useEffect(() => {
    if (!children.length) return;
    void loadChildProfileMetaMap().then(setMetaMap);
  }, [children]);

  const avatars = useMemo(() => {
    return children.map((child, index) => {
      const stored = metaMap[child.id]?.avatarKey;
      const avatarKey: AvatarKey =
        stored && isAvatarKey(stored) ? stored : avatarKeyForIndex(index);
      return { id: child.id, name: child.user.displayName, avatarKey, isPaused: child.isPaused };
    });
  }, [children, metaMap]);

  if (!children.length) {
    return (
      <Pressable
        onPress={onOpenPicker}
        accessibilityRole="button"
        style={[
          styles.bar,
          compact && styles.barCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '18' }]}>
          <Icon name="person-add-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t('assign_select_child')}
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {t('assign_select_child_desc', 'Choose who receives new content.')}
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
      </Pressable>
    );
  }

  if (multi) {
    return (
      <View
        style={[
          styles.multiWrap,
          compact && styles.barCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.multiHeader}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t('adding_for', 'Adding for')}
          </Text>
          {onOpenPicker ? (
            <Pressable onPress={onOpenPicker} hitSlop={8} style={styles.switchBtn}>
              <Text style={[styles.switchText, { color: colors.primary }]}>
                {t('switch_child', 'Switch')}
              </Text>
              <Icon name="chevron-down" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRow}
          keyboardShouldPersistTaps="handled"
        >
          {avatars.map((child) => {
            const selected = child.id === (active?.id ?? null);
            return (
              <Pressable
                key={child.id}
                onPress={() => onSelectChild(child.id)}
                disabled={child.isPaused}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.avatarItem, child.isPaused && styles.avatarPaused]}
              >
                <View
                  style={[
                    styles.avatarRing,
                    {
                      borderColor: selected ? colors.primary : 'transparent',
                      backgroundColor: selected ? colors.primary + '14' : 'transparent',
                    },
                  ]}
                >
                  <ProfileAvatar avatarKey={child.avatarKey} size={40} />
                </View>
                <Text
                  style={[
                    styles.avatarName,
                    { color: selected ? colors.primary : colors.textSecondary },
                    selected && styles.avatarNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {child.name}
                </Text>
                {selected ? (
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                ) : (
                  <View style={styles.activeDotSpacer} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Single child
  const avatarKey =
    (active && metaMap[active.id]?.avatarKey && isAvatarKey(metaMap[active.id].avatarKey!)
      ? (metaMap[active.id].avatarKey as AvatarKey)
      : null) ?? avatarKeyForIndex(0);

  return (
    <Pressable
      onPress={onOpenPicker ?? (() => active && onSelectChild(active.id))}
      accessibilityRole="button"
      style={[
        styles.bar,
        compact && styles.barCompact,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ProfileAvatar avatarKey={avatarKey} size={32} />
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
          {t('adding_for', 'Adding for')}
        </Text>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {active?.user.displayName ?? t('assign_select_child')}
        </Text>
      </View>
      {onOpenPicker ? (
        <View style={[styles.changePill, { backgroundColor: colors.primary + '14' }]}>
          <Text style={[styles.changeText, { color: colors.primary }]}>
            {t('change', 'Change')}
          </Text>
        </View>
      ) : (
        <Icon name="checkmark-circle" size={18} color={colors.primary} />
      )}
    </Pressable>
  );
}

/** Prefetch single-child avatar when meta map not used. */
export function useActiveChildAvatarKey(
  childId: string | null,
  children: ParentChild[],
): AvatarKey {
  const [key, setKey] = useState<AvatarKey>('lion');
  useEffect(() => {
    if (!childId) return;
    const index = children.findIndex((c) => c.id === childId);
    void getChildProfileMeta(childId, Math.max(index, 0)).then((meta) =>
      setKey(meta.avatarKey),
    );
  }, [childId, children]);
  return key;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 12,
    gap: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  barCompact: {
    minHeight: 48,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  multiWrap: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  multiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avatarRow: {
    paddingHorizontal: 10,
    gap: 4,
    alignItems: 'flex-start',
  },
  avatarItem: {
    width: 68,
    alignItems: 'center',
    gap: 4,
  },
  avatarPaused: {
    opacity: 0.4,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 64,
  },
  avatarNameActive: {
    fontWeight: '700',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  activeDotSpacer: {
    width: 5,
    height: 5,
  },
});
