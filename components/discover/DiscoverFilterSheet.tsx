import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppInsets } from '../../hooks/useAppInsets';
import { BRAND_PRIMARY } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

export type FilterItem = { id: string; label: string; icon?: string };

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  items: FilterItem[];
  selectedId: string | null;
  accentColor?: string;
  onSelect: (id: string | null) => void;
  onClose: () => void;
};

export default function DiscoverFilterSheet({
  visible,
  title,
  subtitle,
  items,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { footerBottom } = useAppInsets();
  const gradient: [string, string] = [colors.primary, colors.primaryLight];

  const pick = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.panel, { paddingBottom: footerBottom }]} onPress={() => {}}>
          <LinearGradient
            colors={[colors.primary + '18', colors.surface]}
            style={styles.panelHeader}
          >
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
                ) : null}
              </View>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.border + '88' }]}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const active = selectedId === item.id || (item.id === '' && !selectedId);
              if (active) {
                return (
                  <Pressable key={item.id || '__all__'} onPress={() => pick(item.id || null)}>
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.option, styles.optionActive]}
                    >
                      {item.icon ? (
                        <Icon name={item.icon} size={17} color="#fff" />
                      ) : null}
                      <Text style={[styles.optionText, styles.optionTextActive]} numberOfLines={2}>
                        {item.label}
                      </Text>
                      <Icon name="checkmark-circle" size={17} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={item.id || '__all__'}
                  onPress={() => pick(item.id || null)}
                  style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {item.icon ? (
                    <Icon name={item.icon} size={17} color={colors.primary} />
                  ) : null}
                  <Text style={[styles.optionText, { color: colors.text }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '72%',
    overflow: 'hidden',
  },
  panelHeader: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: { flex: 1 },
  title: { ...typography.h3, marginBottom: 2, fontSize: 17 },
  subtitle: { ...typography.caption, lineHeight: 17 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 46,
  },
  optionActive: {
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  optionTextActive: {
    color: '#fff',
  },
});
