import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';
import DiscoverFilterSheet, { type FilterItem } from './DiscoverFilterSheet';
import { DISCOVER_FILTER_GAP } from './discoverLayout';

type NamedItem = { id: string; name: string };

type Props = {
  categories: NamedItem[];
  languages: NamedItem[];
  selectedCategoryId: string | null;
  selectedLanguageId: string | null;
  onCategoryChange: (id: string | null) => void;
  onLanguageChange: (id: string | null) => void;
  embedded?: boolean;
};

type SheetKind = 'category' | 'language' | null;

function categoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('islamic')) return 'moon-outline';
  if (n.includes('entertain')) return 'happy-outline';
  if (n.includes('cartoon') || n.includes('kids')) return 'color-palette-outline';
  if (n.includes('learn') || n.includes('educat')) return 'school-outline';
  return 'grid-outline';
}

function languageIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('english')) return 'language-outline';
  if (n.includes('urdu')) return 'text-outline';
  if (n.includes('arabic')) return 'book-outline';
  if (n.includes('hindi')) return 'chatbubble-ellipses-outline';
  return 'globe-outline';
}

type FilterBtnProps = {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
};

const FilterButton = memo(function FilterButton({
  label,
  value,
  active,
  onPress,
}: FilterBtnProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.btn,
        {
          backgroundColor: active ? colors.primary + '14' : colors.surface,
          borderColor: active ? colors.primary + '66' : colors.border,
        },
      ]}
    >
      <View style={styles.btnText}>
        <Text
          style={[styles.btnLabel, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[styles.btnValue, { color: active ? colors.primary : colors.text }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Icon
        name="chevron-down"
        size={14}
        color={active ? colors.primary : colors.textMuted}
      />
    </Pressable>
  );
});

/**
 * Equal secondary filter controls on one grid row.
 * Sheets / selection behavior unchanged.
 */
export default function DiscoverCompactFilters({
  categories,
  languages,
  selectedCategoryId,
  selectedLanguageId,
  onCategoryChange,
  onLanguageChange,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedLanguage = languages.find((l) => l.id === selectedLanguageId);
  const hasFilters = !!selectedCategoryId || !!selectedLanguageId;

  const categorySheetItems: FilterItem[] = useMemo(
    () => [
      { id: '', label: t('filter_all_categories'), icon: 'apps-outline' },
      ...categories.map((c) => ({
        id: c.id,
        label: c.name,
        icon: categoryIcon(c.name),
      })),
    ],
    [categories, t],
  );

  const languageSheetItems: FilterItem[] = useMemo(
    () => [
      { id: '', label: t('filter_all_languages'), icon: 'earth-outline' },
      ...languages.map((l) => ({
        id: l.id,
        label: l.name,
        icon: languageIcon(l.name),
      })),
    ],
    [languages, t],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <FilterButton
          label={t('filter_category')}
          value={selectedCategory?.name ?? t('filter_all')}
          active={!!selectedCategoryId}
          onPress={() => setSheet('category')}
        />
        <FilterButton
          label={t('filter_language')}
          value={selectedLanguage?.name ?? t('filter_all')}
          active={!!selectedLanguageId}
          onPress={() => setSheet('language')}
        />
      </View>

      {hasFilters ? (
        <Pressable
          onPress={() => {
            onCategoryChange(null);
            onLanguageChange(null);
          }}
          hitSlop={6}
          accessibilityRole="button"
          style={styles.clearRow}
        >
          <Text style={[styles.clearText, { color: colors.textMuted }]}>
            {t('filter_clear')}
          </Text>
        </Pressable>
      ) : null}

      <DiscoverFilterSheet
        visible={sheet === 'category'}
        title={t('filter_sheet_category_title')}
        subtitle={t('filter_sheet_category_subtitle')}
        items={categorySheetItems}
        selectedId={selectedCategoryId}
        onSelect={onCategoryChange}
        onClose={() => setSheet(null)}
      />
      <DiscoverFilterSheet
        visible={sheet === 'language'}
        title={t('filter_sheet_language_title')}
        subtitle={t('filter_sheet_language_subtitle')}
        items={languageSheetItems}
        selectedId={selectedLanguageId}
        onSelect={onLanguageChange}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: DISCOVER_FILTER_GAP,
    width: '100%',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 10,
    gap: 8,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 0,
  },
  btnText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  btnLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  btnValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearRow: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
