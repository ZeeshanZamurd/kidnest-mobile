import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { assignChannel, assignVideo, fetchChildLibrary, removeChannel, removeVideo } from '../api/assignments';
import { fetchParentChildren, type ParentChild } from '../api/parent';
import type { BrowseChannel, BrowseVideo } from '../api/browse';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/useAppStore';
import type { AssignButtonState } from '../components/discover/AssignActionButton';

type PendingAssign =
  | { type: 'video'; item: BrowseVideo }
  | { type: 'channel'; item: BrowseChannel };

type Nav = NativeStackNavigationProp<RootStackParamList>;

function itemKey(type: 'video' | 'channel', id: string) {
  return `${type}:${id}`;
}

export function useAssignToChild() {
  const navigation = useNavigation<Nav>();
  const apiChildren = useAppStore((s) => s.apiChildren);
  const setApiChildren = useAppStore((s) => s.setApiChildren);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pending, setPending] = useState<PendingAssign | null>(null);
  const [selectOnly, setSelectOnly] = useState(false);
  const [assignedVideoIds, setAssignedVideoIds] = useState<Set<string>>(new Set());
  const [assignedChannelIds, setAssignedChannelIds] = useState<Set<string>>(new Set());
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

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

  const ensureChildren = useCallback(async (): Promise<ParentChild[]> => {
    if (apiChildren.length > 0) return apiChildren;
    try {
      const list = await fetchParentChildren();
      setApiChildren(list);
      return list;
    } catch {
      return [];
    }
  }, [apiChildren, setApiChildren]);

  const openPicker = useCallback(
    async (assign?: PendingAssign) => {
      const list = await ensureChildren();
      if (list.length === 0) {
        Alert.alert('No child profiles', 'Add a child profile first.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add child', onPress: () => navigation.navigate('AddChild') },
        ]);
        return;
      }
      setSelectOnly(!assign);
      setPending(assign ?? null);
      setPickerVisible(true);
    },
    [ensureChildren, navigation],
  );

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
        void reloadAssignments(childId);
      } catch (err) {
        Alert.alert(
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
        void reloadAssignments(childId);
      } catch (err) {
        Alert.alert(
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
        void openPicker({ type: 'video', item: video });
        return;
      }

      const childId = targetChildId;
      if (!childId) {
        Alert.alert('Select a child', 'Choose a child profile first using the bar above.');
        return;
      }

      if (isVideoDirectlyAssigned(video.id)) {
        Alert.alert('Remove video?', video.title, [
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
        Alert.alert(
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
      isVideoAssigned,
      isVideoDirectlyAssigned,
      openPicker,
      performRemoveChannel,
      performRemoveVideo,
      targetChildId,
    ],
  );

  const requestToggleChannel = useCallback(
    (channel: BrowseChannel) => {
      if (!assignedChannelIds.has(channel.id)) {
        void openPicker({ type: 'channel', item: channel });
        return;
      }

      const childId = targetChildId;
      if (!childId) {
        Alert.alert('Select a child', 'Choose a child profile first using the bar above.');
        return;
      }

      Alert.alert('Remove channel?', channel.title, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void performRemoveChannel(childId, channel.id),
        },
      ]);
    },
    [assignedChannelIds, performRemoveChannel, openPicker, targetChildId],
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

      if (selectOnly || !pending) {
        setPickerVisible(false);
        setPending(null);
        setSelectOnly(false);
        void reloadAssignments(childId);
        return;
      }

      const key =
        pending.type === 'video'
          ? itemKey('video', pending.item.id)
          : itemKey('channel', pending.item.id);

      setPickerVisible(false);
      setPending(null);
      setSelectOnly(false);
      setLoadingKey(key);

      try {
        if (pending.type === 'video') {
          await assignVideo(childId, pending.item.id);
          setAssignedVideoIds((prev) => new Set(prev).add(pending.item.id));
        } else {
          await assignChannel(childId, pending.item.id);
          setAssignedChannelIds((prev) => new Set(prev).add(pending.item.id));
        }

        setLoadingKey(null);
        setSuccessKey(key);
        setTimeout(() => {
          setSuccessKey((current) => (current === key ? null : current));
        }, 1200);

        void reloadAssignments(childId);
      } catch (err) {
        setLoadingKey(null);
        Alert.alert(
          'Could not add',
          err instanceof Error ? err.message : 'Please try again.',
        );
      }
    },
    [pending, reloadAssignments, selectOnly, setActiveChild],
  );

  const closePicker = useCallback(() => {
    setPickerVisible(false);
    setPending(null);
    setSelectOnly(false);
  }, []);

  return {
    apiChildren,
    activeChildId: targetChildId,
    pickerVisible,
    openPickerForSelect: () => void openPicker(),
    requestToggleVideo,
    requestToggleChannel,
    requestAssignVideo: requestToggleVideo,
    requestAssignChannel: requestToggleChannel,
    getVideoAssignState,
    getChannelAssignState,
    confirmChild,
    closePicker,
  };
}
