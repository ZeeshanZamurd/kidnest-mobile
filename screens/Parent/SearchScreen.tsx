import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import SearchBar from '../../components/ui/SearchBar';
import VideoCard from '../../components/video/VideoCard';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  browseVideos,
  fetchCategories,
  fetchLanguages,
  type BrowseVideo,
  type Category,
  type Language,
} from '../../api/browse';
import { useAppStore } from '../../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  gradient: [string, string];
};

const FilterChip = memo(function FilterChip({ label, active, onPress, gradient }: ChipProps) {
  const { colors } = useTheme();

  const glow: ViewStyle = active
    ? {
        shadowColor: gradient[0],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: Platform.OS === 'ios' ? 0.24 : 0.16,
        shadowRadius: 5,
        elevation: 3,
      }
    : {};

  return (
    <View style={[styles.chipWrap, glow]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
        {active ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chipActive}
          >
            <Text style={styles.chipActiveText}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.chipIdle, { borderColor: colors.border }]}>
            <Text style={[styles.chipIdleText, { color: colors.textSecondary }]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
});

type ChipRowProps = {
  label: string;
  items: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  gradient: [string, string];
};

function ChipRow({ label, items, selectedId, onSelect, gradient }: ChipRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.filterBlock}>
      <Text style={[styles.filterLabel, { color: colors.textMuted }]}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        <FilterChip label="All" active={!selectedId} gradient={gradient} onPress={() => onSelect(null)} />
        {items.map((item) => (
          <FilterChip
            key={item.id}
            label={item.name}
            active={selectedId === item.id}
            gradient={gradient}
            onPress={() => onSelect(selectedId === item.id ? null : item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const parentSession = useAppStore((s) => s.parentSession);
  const platformAccess = useAppStore((s) => s.platformAccess);
  const mockVideos = useAppStore((s) => s.videos);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [apiVideos, setApiVideos] = useState<BrowseVideo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const useApi = !!parentSession?.idToken;
  const canBrowseAll =
    (platformAccess?.hasFullVideoAccess ?? false) ||
    (platformAccess?.hasAccess ?? false) ||
    (platformAccess?.freeUnlimitedBrowse ?? false);
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

  const chipGradient: [string, string] = [colors.primary, colors.primaryLight];

  useEffect(() => {
    if (!parentSession?.idToken) return;
    void Promise.all([fetchCategories(), fetchLanguages()])
      .then(([cats, langs]) => {
        setCategories(cats);
        setLanguages(langs);
      })
      .catch(() => {});
  }, [parentSession?.idToken]);

  const loadApiResults = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!useApi) return;
      if (!canBrowseAll && append) return;

      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await browseVideos({
          search: searchQuery || undefined,
          categoryId: selectedCategoryId ?? undefined,
          languageId: selectedLanguageId ?? undefined,
          page: pageNum,
          limit: 30,
        });
        setApiVideos((prev) => (append ? [...prev, ...res.data] : res.data));
        setHasMore(canBrowseAll && pageNum < res.meta.totalPages);
      } catch {
        if (!append) setApiVideos([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [useApi, canBrowseAll, searchQuery, selectedCategoryId, selectedLanguageId],
  );

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => void loadApiResults(1, false), 300);
    return () => clearTimeout(timer);
  }, [loadApiResults]);

  const loadMore = useCallback(() => {
    if (!useApi || loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void loadApiResults(next, true);
  }, [useApi, loadingMore, hasMore, page, loadApiResults]);

  const filteredVideos = useMemo(() => {
    if (useApi) {
      return apiVideos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnailUrl ?? '',
        duration: `${Math.floor(v.durationSecs / 60)}:${String(v.durationSecs % 60).padStart(2, '0')}`,
        durationSeconds: v.durationSecs,
        channelId: v.channelId,
        channelName: v.channelName,
        category: 'science' as const,
        status: 'approved' as const,
        views: '0',
        publishedAt: '',
        isFavorite: false,
        watchProgress: 0,
      }));
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return mockVideos.slice(0, 6);
    return mockVideos.filter(
      (v) => v.title.toLowerCase().includes(q) || v.channelName.toLowerCase().includes(q),
    );
  }, [useApi, apiVideos, mockVideos, searchQuery]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedLanguage = languages.find((l) => l.id === selectedLanguageId);
  const activeFilters = [selectedCategory?.name, selectedLanguage?.name].filter(Boolean);

  const listHeader = (
    <>
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Icon name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('search')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('search_placeholder')}</Text>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('search_placeholder')}
          compact
        />
      </View>

      {useApi ? (
        <View style={styles.filters}>
          <ChipRow
            label="Categories"
            items={categories.slice(0, 20)}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            gradient={chipGradient}
          />
          <ChipRow
            label="Languages"
            items={languages.slice(0, 20)}
            selectedId={selectedLanguageId}
            onSelect={setSelectedLanguageId}
            gradient={chipGradient}
          />
          {activeFilters.length > 0 ? (
            <View style={[styles.activeBanner, { backgroundColor: colors.primary + '12' }]}>
              <Icon name="funnel-outline" size={14} color={colors.primary} />
              <Text style={[styles.activeFilter, { color: colors.textSecondary }]}>
                {activeFilters.join(' · ')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
    </>
  );

  return (
    <GradientBackground variant="subtle">
      {!loading && filteredVideos.length === 0 ? (
        <>
          {listHeader}
          <EmptyState icon="search" title={t('no_results')} description={t('search_placeholder')} />
        </>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              showStatus={!useApi}
              onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
            />
          )}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterBlock: {
    gap: 6,
  },
  filterLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: spacing.lg,
  },
  chipWrap: {
    flexShrink: 0,
  },
  chipActive: {
    borderRadius: radius.full,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minHeight: 34,
    minWidth: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActiveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  chipIdle: {
    borderRadius: radius.full,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minHeight: 34,
    minWidth: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  chipIdleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.lg,
    marginTop: 2,
  },
  activeFilter: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginVertical: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
});
