import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/** Full-screen wrapper that respects system safe areas on iOS and Android. */
export default function SafeScreen({ children, edges = ['top', 'bottom'], style }: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
