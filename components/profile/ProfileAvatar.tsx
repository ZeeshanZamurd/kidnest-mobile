import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AVATARS, type AvatarKey } from '../../constants/avatars';

type Props = {
  avatarKey: AvatarKey;
  size?: number;
  style?: ViewStyle;
};

export default function ProfileAvatar({ avatarKey, size = 96, style }: Props) {
  const config = AVATARS[avatarKey];
  const fontSize = size * 0.46;

  return (
    <LinearGradient
      colors={config.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.22 },
        style,
      ]}
    >
      <Text style={[styles.emoji, { fontSize }]}>{config.emoji}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  emoji: {
    textAlign: 'center',
  },
});
