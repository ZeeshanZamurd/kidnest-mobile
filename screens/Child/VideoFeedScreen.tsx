import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import { useOptionalBottomTabBarHeight } from '../../hooks/useScreenPadding';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { Video as VideoItem } from '../../types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

function FeedItem({
  item,
  isActive,
  bottomClearance,
}: {
  item: VideoItem;
  isActive: boolean;
  bottomClearance: number;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);
  const heartScale = useSharedValue(1);
  const [showHeart, setShowHeart] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasDisplayedFrame, setHasDisplayedFrame] = useState(false);
  const streamUri =
    typeof item.streamUrl === 'string' && item.streamUrl.trim().length > 0
      ? item.streamUrl.trim()
      : null;
  const canPlayInline = Boolean(streamUri);

  useEffect(() => {
    if (isActive) {
      setPaused(false);
    } else {
      setPaused(true);
      setHasDisplayedFrame(false);
      setIsBuffering(false);
    }
  }, [isActive]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleDoubleTap = () => {
    toggleFavorite(item.id);
    setShowHeart(true);
    heartScale.value = withSequence(withSpring(1.4), withSpring(1));
    setTimeout(() => setShowHeart(false), 800);
  };

  const lastTapRef = useRef(0);
  const onTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
      return;
    }

    setTimeout(() => {
      if (Date.now() - lastTapRef.current < 300) return;
      if (canPlayInline) {
        setPaused((p) => !p);
        return;
      }
      navigation.navigate('VideoPlayer', { videoId: item.id });
    }, 300);
    lastTapRef.current = now;
  };

  const showBuffering = isActive && canPlayInline && (!hasDisplayedFrame || isBuffering);

  return (
    <View style={styles.page}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
        {isActive && streamUri ? (
          <Video
            source={{ uri: streamUri }}
            style={styles.fullImage}
            resizeMode="cover"
            paused={paused}
            repeat
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            onLoadStart={() => {
              setHasDisplayedFrame(false);
              setIsBuffering(true);
            }}
            onReadyForDisplay={() => {
              setHasDisplayedFrame(true);
            }}
            onBuffer={(e) => {
              setIsBuffering(e.isBuffering);
            }}
          />
        ) : (
          <Image source={{ uri: item.thumbnail }} style={styles.fullImage} resizeMode="cover" />
        )}
        <View style={styles.overlay} />
      </Pressable>

      {showBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      {paused && isActive && hasDisplayedFrame && !isBuffering && (
        <View style={styles.playOverlay} pointerEvents="none">
          <View style={styles.playCircle}>
            <Icon name="play" size={36} color="#fff" />
          </View>
        </View>
      )}

      {showHeart && (
        <Animated.View style={[styles.heartBurst, heartStyle]}>
          <Icon name="heart" size={80} color="#FF6B9D" />
        </Animated.View>
      )}

      <View style={styles.shortBadge}>
        <Icon name="flash" size={12} color="#fff" />
        <Text style={styles.shortBadgeText}>Short</Text>
      </View>

      <View style={[styles.sideActions, { bottom: bottomClearance + 56 }]}>
        <Pressable style={styles.actionBtn} onPress={() => toggleFavorite(item.id)}>
          <Icon name={item.isFavorite ? 'heart' : 'heart-outline'} size={28} color="#fff" />
        </Pressable>
        {!canPlayInline && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
          >
            <Icon name="expand" size={24} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={[styles.bottomInfo, { paddingBottom: bottomClearance + spacing.lg }]}>
        <Text style={styles.feedTitle}>{item.title}</Text>
        <Text style={styles.feedChannel}>{item.channelName}</Text>
        {isActive && <Text style={styles.hint}>{t('double_tap_like')}</Text>}
      </View>
    </View>
  );
}

export default function VideoFeedScreen() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const { shortVideos, loading } = useChildLibrary(activeChildId);
  const tabBarHeight = useOptionalBottomTabBarHeight();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: VideoItem; index: number }) => (
      <FeedItem item={item} isActive={index === activeIndex} bottomClearance={tabBarHeight} />
    ),
    [activeIndex, tabBarHeight],
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (shortVideos.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Icon name="flash-outline" size={48} color="rgba(255,255,255,0.35)" />
        <Text style={styles.emptyTitle}>{t('no_shorts_assigned')}</Text>
        <Text style={styles.emptyDesc}>{t('no_shorts_assigned_desc')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shortVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { ...typography.h3, color: '#fff', textAlign: 'center' },
  emptyDesc: { ...typography.body, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end',
  },
  fullImage: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBurst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
  },
  shortBadge: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  shortBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  sideActions: {
    position: 'absolute',
    right: 16,
    gap: 20,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfo: {
    padding: 20,
  },
  feedTitle: {
    ...typography.h3,
    color: '#fff',
    marginBottom: 4,
  },
  feedChannel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  hint: {
    ...typography.tiny,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
});
