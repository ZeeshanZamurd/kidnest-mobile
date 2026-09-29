import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { playerTheme } from './playerTheme';

/** Quiet in-frame loader — no shimmer band, no bouncing dots. */
export default function PlayerBufferingOverlay() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: playerTheme.buffering.scrim,
    zIndex: 4,
  },
});
