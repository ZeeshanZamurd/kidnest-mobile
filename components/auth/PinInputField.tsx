import React, { useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import SecureTextInput from '../ui/SecureTextInput';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  editable?: boolean;
  /** Show helper under the field (default true). Use false on confirm PIN. */
  showHint?: boolean;
  onFocusScroll?: (target: View | null) => void;
};

export default function PinInputField({
  label,
  value,
  onChangeText,
  error,
  editable = true,
  showHint = true,
  onFocusScroll,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const wrapRef = useRef<View>(null);
  const [focused, setFocused] = React.useState(false);

  const handleChange = (text: string) => {
    onChangeText(text.replace(/\D/g, '').slice(0, 4));
  };

  return (
    <View ref={wrapRef} collapsable={false} style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <SecureTextInput
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={4}
        editable={editable}
        placeholder="••••"
        placeholderTextColor={colors.textMuted}
        onFocus={() => {
          setFocused(true);
          setTimeout(
            () => onFocusScroll?.(wrapRef.current),
            Platform.OS === 'ios' ? 50 : 120,
          );
        }}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
            borderWidth: error || focused ? 1.5 : 1,
          },
        ]}
        accessibilityLabel={label}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : showHint ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{t('pin_hint')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    ...typography.body,
    letterSpacing: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  hint: { ...typography.tiny, marginTop: 6, lineHeight: 16 },
  error: { ...typography.tiny, marginTop: 6 },
});
