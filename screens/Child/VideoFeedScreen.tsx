import React, { useCallback, useRef, useState } from 'react';
import {
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getApprovedVideos } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { Video } from '../../types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

function FeedItem({
  item,
  isActive,
  bottomClearance,
}: {
  item: Video;
  isActive: boolean;
  bottomClearance: number;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);
  const heartScale = useSharedValue(1);
  const [showHeart, setShowHeart] = useState(false);

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
    } else {
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 300) {
          navigation.navigate('VideoPlayer', { videoId: item.id });
        }
      }, 300);
    }
    lastTapRef.current = now;
  };

  return (
    <View style={styles.page}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
        <Image source={{ uri: item.thumbnail }} style={styles.fullImage} resizeMode="cover" />
        <View style={styles.overlay} />
      </Pressable>

      {showHeart && (
        <Animated.View style={[styles.heartBurst, heartStyle]}>
          <Icon name="heart" size={80} color="#FF6B9D" />
        </Animated.View>
      )}

      <View style={[styles.sideActions, { bottom: bottomClearance + 56 }]}>
        <Pressable style={styles.actionBtn} onPress={() => toggleFavorite(item.id)}>
          <Icon name={item.isFavorite ? 'heart' : 'heart-outline'} size={28} color="#fff" />
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Icon name="bookmark-outline" size={28} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.bottomInfo, { paddingBottom: bottomClearance + spacing.lg }]}>
        <Text style={styles.feedTitle}>{item.title}</Text>
        <Text style={styles.feedChannel}>{item.channelName}</Text>
        {isActive && (
          <Text style={styles.hint}>{t('double_tap_like')}</Text>
        )}
      </View>
    </View>
  );
}

export default function VideoFeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videos = getApprovedVideos();
  const tabBarHeight = useBottomTabBarHeight();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Video; index: number }) => (
      <FeedItem item={item} isActive={index === activeIndex} bottomClearance={tabBarHeight} />
    ),
    [activeIndex, tabBarHeight],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
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
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end',
  },
  fullImage: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heartBurst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
  },
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
