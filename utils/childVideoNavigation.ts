import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import type { ContentType } from '../types';

type AppNav = NavigationProp<RootStackParamList>;

export function openChildVideo(
  navigation: AppNav,
  video: { id: string; contentType?: ContentType; channelId?: string },
  options?: { channelId?: string },
) {
  if (video.contentType === 'SHORT') {
    navigation.navigate('ChildTabs', {
      screen: 'ChildFeed',
      params: {
        videoId: video.id,
        channelId: options?.channelId ?? video.channelId,
      },
    });
    return;
  }
  navigation.navigate('VideoPlayer', { videoId: video.id });
}

/** Route by content type — shorts always open in the vertical feed (child). */
export function openVideoContent(
  navigation: AppNav,
  video: { id: string; contentType?: ContentType; channelId?: string },
  role: 'parent' | 'child' | null | undefined,
  options?: { channelId?: string },
) {
  if (video.contentType === 'SHORT' && role === 'child') {
    openChildVideo(navigation, video, options);
    return;
  }
  navigation.navigate('VideoPlayer', { videoId: video.id });
}
