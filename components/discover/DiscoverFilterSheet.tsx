import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

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

const SHEET_PAD = 16;
const COL_GAP = 8;
const ICON_SIZE = 14;

/**
 * Dark-theme filter sheet — stable 2-column grid, compact chips.
 * Selection / close behavior unchanged.
 */
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
  const { width: windowW } = useWindowDimensions();

  const chipWidth = (windowW - SHEET_PAD * 2 - COL_GAP) / 2;

  const pick = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              paddingBottom: Math.max(footerBottom, 12),
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {items.map((item) => {
              const active = selectedId === item.id || (item.id === '' && !selectedId);
              const key = item.id || '__all__';

              return (
                <Pressable
                  key={key}
                  onPress={() => pick(item.id || null)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.chip,
                    {
                      width: chipWidth,
                      backgroundColor: active ? colors.primary + '22' : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {item.icon ? (
                    <Icon
                      name={item.icon}
                      size={ICON_SIZE}
                      color={active ? colors.primary : colors.textMuted}
                      style={styles.chipIcon}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.primary : colors.text },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                  {active ? (
                    <Icon name="checkmark" size={14} color={colors.primary} />
                  ) : (
                    <View style={styles.checkSpacer} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: SHEET_PAD,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COL_GAP,
    paddingHorizontal: SHEET_PAD,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipIcon: {
    width: ICON_SIZE + 2,
    textAlign: 'center',
  },
  chipText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  checkSpacer: {
    width: 14,
  },
});
