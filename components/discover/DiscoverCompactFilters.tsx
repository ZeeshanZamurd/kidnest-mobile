import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme/colors';
import DiscoverFilterSheet, { type FilterItem } from './DiscoverFilterSheet';

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

type PickerProps = {
  icon: string;
  title: string;
  value: string;
  active: boolean;
  onPress: () => void;
};

const FilterPicker = memo(function FilterPicker({
  icon,
  title,
  value,
  active,
  onPress,
}: PickerProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.picker,
        active
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Icon name={icon} size={16} color={active ? '#fff' : colors.textMuted} />
      <View style={styles.pickerText}>
        <Text
          style={[styles.pickerTitle, { color: active ? 'rgba(255,255,255,0.85)' : colors.textMuted }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.pickerValue, { color: active ? '#fff' : colors.text }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Icon name="chevron-down" size={16} color={active ? '#fff' : colors.textMuted} />
    </Pressable>
  );
});

export default function DiscoverCompactFilters({
  categories,
  languages,
  selectedCategoryId,
  selectedLanguageId,
  onCategoryChange,
  onLanguageChange,
}: Props) {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedLanguage = languages.find((l) => l.id === selectedLanguageId);

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
    <View style={styles.strip}>
      <FilterPicker
        icon="grid-outline"
        title={t('filter_category')}
        value={selectedCategory?.name ?? t('filter_all')}
        active={!!selectedCategoryId}
        onPress={() => setSheet('category')}
      />
      <FilterPicker
        icon="language-outline"
        title={t('filter_language')}
        value={selectedLanguage?.name ?? t('filter_all')}
        active={!!selectedLanguageId}
        onPress={() => setSheet('language')}
      />

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
  strip: {
    flexDirection: 'row',
    gap: 10,
  },
  picker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pickerText: {
    flex: 1,
    minWidth: 0,
  },
  pickerTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  pickerValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
