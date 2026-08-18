import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CachedImage from '../../ui/CachedImage';
import { BRAND_PRIMARY } from '../../../constants/branding';

type Props = {
  thumbnailUrl: string;
};

/** Thumbnail + spinner shown until the video renders its first frame. */
export default function VideoPosterLoader({ thumbnailUrl }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <CachedImage uri={thumbnailUrl} style={styles.thumb} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(8,5,22,0.15)', 'rgba(8,5,22,0.45)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.loaderCard}>
        <ActivityIndicator color={BRAND_PRIMARY} size="large" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    backgroundColor: '#0F0A1F',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  loaderCard: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
