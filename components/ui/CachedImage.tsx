import React, { memo, useEffect, useState } from 'react';
import {
  Image,
  type ImageProps,
  type ImageStyle,
  type StyleProp,
  View,
  StyleSheet,
} from 'react-native';
import { prefetchImage } from '../../services/cache/imageCache';

type Props = Omit<ImageProps, 'source'> & {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  fallbackColor?: string;
};

function CachedImageInner({ uri, style, fallbackColor = '#e2e8f0', ...rest }: Props) {
  const [ready, setReady] = useState(false);
  const normalized = uri?.trim() ?? '';

  useEffect(() => {
    if (!normalized) {
      setReady(false);
      return;
    }
    let cancelled = false;
    void prefetchImage(normalized).then((ok) => {
      if (!cancelled) setReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [normalized]);

  if (!normalized) {
    return <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]} />;
  }

  return (
    <Image
      {...rest}
      source={{ uri: normalized }}
      style={[style, !ready && styles.hiddenUntilReady]}
      fadeDuration={ready ? 0 : 150}
    />
  );
}

const CachedImage = memo(CachedImageInner);
export default CachedImage;

const styles = StyleSheet.create({
  fallback: { overflow: 'hidden' },
  hiddenUntilReady: { opacity: 0.92 },
});
