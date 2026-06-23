import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import ProfileAvatar from './ProfileAvatar';
import { AVATAR_KEYS, AVATARS, type AvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  selected: AvatarKey;
  onSelect: (key: AvatarKey) => void;
};

export default function AvatarPicker({ selected, onSelect }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('choose_avatar')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {AVATAR_KEYS.map((key) => {
          const isSelected = key === selected;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={[
                styles.item,
                isSelected && { borderColor: colors.primary, borderWidth: 3 },
              ]}
            >
              <ProfileAvatar avatarKey={key} size={72} />
              <Text style={[styles.itemLabel, { color: colors.textMuted }]}>
                {AVATARS[key].label}
              </Text>
              {isSelected ? (
                <View style={[styles.check, { backgroundColor: colors.primary }]}>
                  <Icon name="checkmark" size={14} color="#fff" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.sm, marginLeft: 2 },
  row: { gap: spacing.md, paddingVertical: spacing.xs },
  item: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: spacing.sm,
    gap: 4,
  },
  itemLabel: { ...typography.tiny },
  check: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
