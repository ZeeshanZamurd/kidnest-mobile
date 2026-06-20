import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  compact?: boolean;
};

export default function SearchBar({ value, onChangeText, placeholder, compact }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        {
          backgroundColor: compact ? colors.surfaceGlass : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Icon name="search" size={compact ? 17 : 20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, compact && styles.inputCompact, { color: colors.text }]}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Icon
          name="close-circle"
          size={18}
          color={colors.textMuted}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  wrapCompact: {
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  input: {
    flex: 1,
    ...typography.body,
    padding: 0,
    fontSize: 15,
  },
  inputCompact: {
    fontSize: 14,
  },
});
