import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing } from '../../theme/colors';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Fixed bottom area that clears the system navigation bar. */
export default function ScreenFooter({ children, style }: Props) {
  const { footerBottom } = useAppInsets();

  return (
    <View style={[styles.footer, { paddingBottom: footerBottom }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
  },
});
