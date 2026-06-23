import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import ProfileAvatar from './ProfileAvatar';
import { getChildProfileMeta } from '../../services/childProfileMetaStorage';
import type { ParentChild } from '../../api/parent';
import type { AvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  children: ParentChild[];
  activeChildId: string | null;
  onPress: () => void;
};

export default function SelectedChildBar({ children, activeChildId, onPress }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [avatarKey, setAvatarKey] = useState<AvatarKey>('lion');

  const active = children.find((c) => c.id === activeChildId) ?? children[0];
  const name = active?.user.displayName;

  useEffect(() => {
    if (!active) return;
    const index = children.findIndex((c) => c.id === active.id);
    void getChildProfileMeta(active.id, Math.max(index, 0)).then((meta) =>
      setAvatarKey(meta.avatarKey),
    );
  }, [active, children]);

  if (!children.length) return null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.bar, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '40' }]}
    >
      <ProfileAvatar avatarKey={avatarKey} size={36} />
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{t('assigning_to')}</Text>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name ?? t('assign_select_child')}
        </Text>
      </View>
      <Icon name="chevron-down" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  textCol: { flex: 1, gap: 1 },
  label: { ...typography.tiny },
  name: { ...typography.bodyBold, fontSize: 15 },
});
