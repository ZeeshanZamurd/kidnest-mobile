import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
};

export default function PinInputField({
  label,
  value,
  onChangeText,
  error,
  editable = true,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleChange = (text: string) => {
    onChangeText(text.replace(/\D/g, '').slice(0, 4));
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <SecureTextInput
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={4}
        editable={editable}
        placeholder="••••"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
        accessibilityLabel={label}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{t('pin_hint')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 20,
  },
  hint: { ...typography.tiny, marginTop: 6 },
  error: { ...typography.tiny, marginTop: 6 },
});
