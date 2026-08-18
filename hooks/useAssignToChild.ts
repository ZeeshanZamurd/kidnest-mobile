import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { assignChannel, assignVideo, fetchChildLibrary, removeChannel, removeVideo } from '../api/assignments';
import { CacheManager } from '../services/cache';
import type { BrowseChannel, BrowseVideo } from '../api/browse';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/useAppStore';
import type { AssignButtonState } from '../components/discover/AssignActionButton';
import { KidAlert } from '../services/kidAlert';
import { loadParentChildren } from '../services/parentChildrenCache';

type PendingAssign =
  | { type: 'video'; item: BrowseVideo }
  | { type: 'channel'; item: BrowseChannel };

type Nav = NativeStackNavigationProp<RootStackParamList>;

function itemKey(type: 'video' | 'channel', id: string) {
  return `${type}:${id}`;
}

function isLimitError(message: string): boolean {
  return /upgrade|limit|premium|subscription/i.test(message);
}

export function useAssignToChild() {
  const navigation = useNavigation<Nav>();
  const apiChildren = useAppStore((s) => s.apiChildren);
  const apiChildrenLoaded = useAppStore((s) => s.apiChildrenLoaded);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const platformAccess = useAppStore((s) => s.platformAccess);
  const setActiveChild = useAppStore((s) => s.setActiveChild);

  const hasFullVideoAccess =
    platformAccess?.hasFullVideoAccess ?? false;
  const canAssignChannels = platformAccess?.canAssignChannels ?? hasFullVideoAccess;
  const freeMaxAssignments = platformAccess?.freeMaxAssignments ?? 10;

  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectOnly, setSelectOnly] = useState(false);
  const [assignedVideoIds, setAssignedVideoIds] = useState<Set<string>>(new Set());
  const [assignedChannelIds, setAssignedChannelIds] = useState<Set<string>>(new Set());
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);
  const [assigningChildId, setAssigningChildId] = useState<string | null>(null);

  const targetChildId = activeChildId ?? apiChildren[0]?.id ?? null;

  const reloadAssignments = useCallback(async (childId: string) => {
    try {
      const lib = await fetchChildLibrary(childId);
      setAssignedVideoIds(new Set(lib.videos.map((v) => v.videoId)));
      setAssignedChannelIds(new Set(lib.channels.map((c) => c.channelId)));
    } catch {
      setAssignedVideoIds(new Set());
      setAssignedChannelIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (targetChildId) {
      void reloadAssignments(targetChildId);
    } else {
      setAssignedVideoIds(new Set());
      setAssignedChannelIds(new Set());
    }
  }, [targetChildId, reloadAssignments]);

  useFocusEffect(
    useCallback(() => {
      if (targetChildId) {
        void reloadAssignments(targetChildId);
      }
    }, [targetChildId, reloadAssignments]),
  );

  const ensureChildren = useCallback(async () => {
    if (apiChildrenLoaded) return apiChildren;
    try {
      return await loadParentChildren();
    } catch {
      return null;
    }
  }, [apiChildren, apiChildrenLoaded]);

  const promptAddChild = useCallback(() => {
    KidAlert.alert('No child profiles', 'Add a child profile first.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add child', onPress: () => navigation.navigate('AddChild') },
    ]);
  }, [navigation]);

  const performAssign = useCallback(
    async (childId: string, assign: PendingAssign) => {
      const key =
        assign.type === 'video'
          ? itemKey('video', assign.item.id)
          : itemKey('channel', assign.item.id);

      setActiveChild(childId);
      setAssigningChildId(childId);
      setLoadingKey(key);

      try {
        if (assign.type === 'video') {
          await assignVideo(childId, assign.item.id);
          setAssignedVideoIds((prev) => new Set(prev).add(assign.item.id));
        } else {
          await assignChannel(childId, assign.item.id);
          setAssignedChannelIds((prev) => new Set(prev).add(assign.item.id));
        }

        setSuccessKey(key);
        setTimeout(() => {
          setSuccessKey((current) => (current === key ? null : current));
        }, 1200);

        CacheManager.invalidate(`library:${childId}`);
        CacheManager.invalidate(`feed:${childId}`);
        void reloadAssignments(childId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Please try again.';
        if (isLimitError(msg)) {
          KidAlert.alert('Limit reached', msg, [
            { text: 'Not now', style: 'cancel' },
            { text: 'View plans', onPress: () => navigation.navigate('Subscription') },
          ]);
        } else {
          KidAlert.alert('Could not add', msg);
        }
      } finally {
        setAssigningChildId(null);
        setLoadingKey(null);
      }
    },
    [navigation, reloadAssignments, setActiveChild],
  );

  const assignToActiveChild = useCallback(
    async (assign: PendingAssign) => {
      const children = await ensureChildren();
      if (children === null) {
        KidAlert.alert('Could not load profiles', 'Please check your connection and try again.');
        return;
      }

      if (children.length === 0) {
        promptAddChild();
        return;
      }

      const childId = activeChildId ?? children[0]?.id;
      if (!childId) {
        promptAddChild();
        return;
      }

      const child = children.find((c) => c.id === childId);
      if (child?.isPaused) {
        KidAlert.alert('Profile paused', 'Unpause this child profile before adding content.');
        return;
      }

      await performAssign(childId, assign);
    },
    [activeChildId, ensureChildren, performAssign, promptAddChild],
  );

  const openPickerForSelect = useCallback(async () => {
    const children = await ensureChildren();
    if (children === null) {
      KidAlert.alert('Could not load profiles', 'Please check your connection and try again.');
      return;
    }

    if (children.length === 0) {
      promptAddChild();
      return;
    }

    setSelectOnly(true);
    setPickerVisible(true);
  }, [ensureChildren, promptAddChild]);

  const isVideoDirectlyAssigned = useCallback(
    (videoId: string) => assignedVideoIds.has(videoId),
    [assignedVideoIds],
  );

  const isVideoAssigned = useCallback(
    (videoId: string, channelId?: string) =>
      isVideoDirectlyAssigned(videoId) ||
      (channelId != null && assignedChannelIds.has(channelId)),
    [isVideoDirectlyAssigned, assignedChannelIds],
  );

  const performRemoveVideo = useCallback(
    async (childId: string, video: BrowseVideo) => {
      const key = itemKey('video', video.id);
      setLoadingKey(key);
      try {
        await removeVideo(childId, video.id);
        setAssignedVideoIds((prev) => {
          const next = new Set(prev);
          next.delete(video.id);
          return next;
        });
        CacheManager.invalidate(`library:${childId}`);
        CacheManager.invalidate(`feed:${childId}`);
        void reloadAssignments(childId);
      } catch (err) {
        KidAlert.alert(
          'Could not remove',
          err instanceof Error ? err.message : 'Please try again.',
        );
      } finally {
        setLoadingKey(null);
      }
    },
    [reloadAssignments],
  );

  const performRemoveChannel = useCallback(
    async (childId: string, channelId: string) => {
      const key = itemKey('channel', channelId);
      setLoadingKey(key);
      try {
        await removeChannel(childId, channelId);
        setAssignedChannelIds((prev) => {
          const next = new Set(prev);
          next.delete(channelId);
          return next;
        });
        CacheManager.invalidate(`library:${childId}`);
        CacheManager.invalidate(`feed:${childId}`);
        void reloadAssignments(childId);
      } catch (err) {
        KidAlert.alert(
          'Could not remove',
          err instanceof Error ? err.message : 'Please try again.',
        );
      } finally {
        setLoadingKey(null);
      }
    },
    [reloadAssignments],
  );

  const requestToggleVideo = useCallback(
    (video: BrowseVideo) => {
      if (!isVideoAssigned(video.id, video.channelId)) {
        void assignToActiveChild({ type: 'video', item: video });
        return;
      }

      const childId = targetChildId;
      if (!childId) {
        KidAlert.alert('Select a child', 'Choose a child profile first using the bar above.');
        return;
      }

      if (!hasFullVideoAccess) {
        KidAlert.alert(
          'Cannot remove',
          'Free plan videos stay in your library. Subscribe for full control.',
          [
            { text: 'OK', style: 'cancel' },
            { text: 'View plans', onPress: () => navigation.navigate('Subscription') },
          ],
        );
        return;
      }

      if (isVideoDirectlyAssigned(video.id)) {
        KidAlert.alert('Remove video?', video.title, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => void performRemoveVideo(childId, video),
          },
        ]);
        return;
      }

      if (video.channelId && assignedChannelIds.has(video.channelId)) {
        KidAlert.alert(
          'Remove channel?',
          `"${video.channelName}" was added as a whole channel. Remove it to unassign all its videos.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove channel',
              style: 'destructive',
              onPress: () => void performRemoveChannel(childId, video.channelId),
            },
          ],
        );
      }
    },
    [
      assignedChannelIds,
      assignToActiveChild,
      hasFullVideoAccess,
      isVideoAssigned,
      isVideoDirectlyAssigned,
      navigation,
      performRemoveChannel,
      performRemoveVideo,
      targetChildId,
    ],
  );

  const requestToggleChannel = useCallback(
    (channel: BrowseChannel) => {
      if (!canAssignChannels) {
        KidAlert.alert(
          'Subscribe for channels',
          'Free plan includes up to 10 individual videos. Subscribe to add whole channels.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'View plans', onPress: () => navigation.navigate('Subscription') },
          ],
        );
        return;
      }

      if (!assignedChannelIds.has(channel.id)) {
        void assignToActiveChild({ type: 'channel', item: channel });
        return;
      }

      const childId = targetChildId;
      if (!childId) {
        KidAlert.alert('Select a child', 'Choose a child profile first using the bar above.');
        return;
      }

      KidAlert.alert('Remove channel?', channel.title, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void performRemoveChannel(childId, channel.id),
        },
      ]);
    },
    [assignedChannelIds, assignToActiveChild, canAssignChannels, navigation, performRemoveChannel, targetChildId],
  );

  const getVideoAssignState = useCallback(
    (videoId: string, channelId?: string): AssignButtonState => {
      const key = itemKey('video', videoId);
      if (loadingKey === key) return 'loading';
      if (successKey === key) return 'success';
      if (isVideoAssigned(videoId, channelId)) return 'assigned';
      return 'idle';
    },
    [isVideoAssigned, loadingKey, successKey],
  );

  const getChannelAssignState = useCallback(
    (channelId: string): AssignButtonState => {
      const key = itemKey('channel', channelId);
      if (loadingKey === key) return 'loading';
      if (successKey === key) return 'success';
      if (assignedChannelIds.has(channelId)) return 'assigned';
      return 'idle';
    },
    [assignedChannelIds, loadingKey, successKey],
  );

  const confirmChild = useCallback(
    async (childId: string) => {
      setActiveChild(childId);
      setPickerVisible(false);
      setSelectOnly(false);
      void reloadAssignments(childId);
    },
    [reloadAssignments, setActiveChild],
  );

  const closePicker = useCallback(() => {
    if (assigningChildId) return;
    setPickerVisible(false);
    setSelectOnly(false);
  }, [assigningChildId]);

  return {
    apiChildren,
    activeChildId: targetChildId,
    pickerVisible,
    pickerLoading: false,
    pickerSelectOnly: selectOnly,
    assigningChildId,
    openPickerForSelect: () => void openPickerForSelect(),
    requestToggleVideo,
    requestToggleChannel,
    requestAssignVideo: requestToggleVideo,
    requestAssignChannel: requestToggleChannel,
    getVideoAssignState,
    getChannelAssignState,
    confirmChild,
    closePicker,
    reloadAssignments,
    canAssignChannels,
    freeMaxAssignments,
    hasFullVideoAccess,
  };
};
