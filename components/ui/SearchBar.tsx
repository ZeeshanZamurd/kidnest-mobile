import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Slimmer Discover-style field (shared elsewhere via compact). */
  compact?: boolean;
};

/**
 * Professional search field. Compact mode is the Discover default:
 * fixed height, soft rectangle, centered icon + text.
 */
export default function SearchBar({ value, onChangeText, placeholder, compact }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        compact ? styles.wrapCompact : styles.wrapDefault,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Icon
        name="search-outline"
        size={compact ? 16 : 20}
        color={colors.textMuted}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          compact ? styles.inputCompact : styles.inputDefault,
          { color: colors.text },
        ]}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clearBtn}
        >
          <Icon name="close-circle" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  wrapDefault: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    gap: 10,
  },
  wrapCompact: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    gap: 8,
  },
  icon: {
    marginTop: 1,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputDefault: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  inputCompact: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  clearBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
