import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import GradientBackground from '../../components/ui/GradientBackground';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { radius, spacing, typography } from '../../theme/colors';

const typeIcons: Record<string, string> = {
  approval: 'checkmark-circle',
  limit: 'time',
  achievement: 'trophy',
  system: 'sync',
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

  if (notifications.length === 0) {
    return (
      <GradientBackground>
        <EmptyState
          icon="notifications-off"
          title={t('no_notifications')}
          description={t('no_notifications_desc')}
        />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>{t('notifications')}</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markRead(item.id)}
            style={[
              styles.card,
              {
                backgroundColor: item.read ? colors.card : colors.primary + '10',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Icon name={typeIcons[item.type] ?? 'notifications'} size={22} color={colors.primary} />
            </View>
            <View style={styles.content}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.body, { color: colors.textMuted }]}>{item.body}</Text>
            </View>
            {!item.read && <View style={[styles.unread, { backgroundColor: colors.primary }]} />}
          </Pressable>
        )}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  cardTitle: { ...typography.bodyBold, marginBottom: 4 },
  body: { ...typography.caption, lineHeight: 18 },
  unread: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
