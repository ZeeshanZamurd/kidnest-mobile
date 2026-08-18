import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { shortDescription, type BrowseChannel } from '../../api/browse';
import { radius, spacing, typography } from '../../theme/colors';
import AssignActionButton, { type AssignButtonState } from './AssignActionButton';
import PremiumContentBadge from '../ui/PremiumContentBadge';
import CachedImage from '../ui/CachedImage';

type Props = {
  channel: BrowseChannel;
  onPress: () => void;
  onAdd?: () => void;
  assignState?: AssignButtonState;
  premiumLocked?: boolean;
};

function DiscoverChannelCard({
  channel,
  onPress,
  onAdd,
  assignState = 'idle',
  premiumLocked = false,
}: Props) {
  const { colors } = useTheme();
  const shorts = channel.shortCount ?? 0;
  const videos = channel.videoCount ?? 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: premiumLocked ? colors.primary + '50' : colors.border,
        },
        premiumLocked && styles.cardLocked,
      ]}
    >
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={
            premiumLocked
              ? [colors.primary + '12', colors.accent + '08']
              : [colors.primary + '22', colors.accent + '12']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.avatarWrap}>
            <CachedImage uri={channel.thumbnailUrl} style={styles.avatar} />
            {premiumLocked ? (
              <View style={styles.avatarLock}>
                <Icon name="lock-closed" size={16} color="#fff" />
              </View>
            ) : null}
          </View>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {channel.title}
              </Text>
              {premiumLocked ? <PremiumContentBadge compact /> : null}
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statPill, { backgroundColor: colors.primary + '18' }]}>
                <Icon name="film-outline" size={12} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.primary }]}>{videos} videos</Text>
              </View>
              {shorts > 0 ? (
                <View style={[styles.statPill, { backgroundColor: colors.accent + '18' }]}>
                  <Icon name="flash" size={12} color={colors.accent} />
                  <Text style={[styles.statText, { color: colors.accent }]}>{shorts} shorts</Text>
                </View>
              ) : null}
            </View>
            {channel.description ? (
              <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
                {shortDescription(channel.description, 80)}
              </Text>
            ) : null}
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textMuted} />
        </LinearGradient>
      </Pressable>
      {onAdd && !premiumLocked ? (
        <View style={[styles.addRow, { borderTopColor: colors.border }]}>
          <AssignActionButton
            state={assignState}
            onPress={onAdd}
            variant="full"
            label="Add channel"
            assignedLabel="Channel added"
            style={styles.addBtnFull}
          />
        </View>
      ) : premiumLocked ? (
        <View style={[styles.addRow, styles.premiumRow, { borderTopColor: colors.border }]}>
          <Icon name="diamond" size={15} color={colors.primary} />
          <Text style={[styles.premiumRowText, { color: colors.primary }]}>Subscribe to browse & add</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.92,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarLock: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  statText: {
    fontSize: 11,
    fontWeight: '700',
  },
  desc: {
    ...typography.caption,
    lineHeight: 17,
  },
  addRow: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  addBtnFull: {
    alignSelf: 'center',
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  premiumRowText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default memo(DiscoverChannelCard);
