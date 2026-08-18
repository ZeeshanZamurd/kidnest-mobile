# KidNest Mobile — Performance Audit Report

**Date:** June 2026  
**Scope:** YouTube-like caching, scrolling, and responsiveness for child content browsing.

---

## Executive Summary

The app now uses a centralized cache layer, stale-while-revalidate API fetching, image prefetching, native video caching, FlashList on heavy scroll surfaces, and React memoization on list row components. Repeat visits to categories, channels, and the child home screen should show cached content immediately with silent background refresh.

---

## Bottlenecks Found (Before)

| Area | Issue | Impact |
|------|-------|--------|
| API | Every screen refetched on mount; no deduplication | Spinners on every navigation |
| Images | Raw `<Image>` with no prefetch | Thumbnail flicker, redundant downloads |
| Video | No `shouldCache` on player | Re-buffering on reopen |
| Lists | Default FlatList tuning; no row memoization | Jank with 100+ items |
| Child home | Full loading gate; no silent refresh | Blank sections while API loads |
| Assign flow | Stale library cache after assign/remove | Wrong content until manual refresh |
| Navigation | Eager imports for heavy player screens | Slower cold start |
| Offline | No fallback when network fails | Empty screens despite prior visits |

---

## Optimizations Applied

### 1. Video caching
- `buildCachedVideoSource()` enables `shouldCache: true` on `react-native-video` (ExoPlayer/AVFoundation native LRU ~2 GB).
- Used in `VideoPlayerScreen`, `VideoFeedScreen`, and inline `VideoCard` playback.
- Buffer config tuned for fast start (`bufferForPlaybackMs: 1000`).

### 2. Image caching
- `CachedImage` component with prefetch + fade suppression.
- `imageCache.ts` dedupes prefetch via `Image.prefetch` + in-memory URI tracking.
- Integrated across: `VideoCard`, `DiscoverMediaCard`, `DiscoverChannelCard`, `ChildChannelCard`, `ChildKidVideoCard`, `ChildLibraryList`, channel detail heroes, feed player.

### 3. API caching (stale-while-revalidate)
- `CacheManager` — memory LRU (300 entries) + AsyncStorage persistence, versioned keys, expiry cleanup.
- `api/client.ts` — GET deduplication, SWR, abort signal support.
- Cached endpoints: browse (categories, languages, videos, channels, details), assignments (library, feed), parent (platform access, dashboard, children).

### 4. Prefetching
- `prefetch.ts` — thumbnail batches, feed window prefetch, channel avatars.
- Scroll-triggered prefetch on Discover, Channel Detail, Child Channel Detail, Video Feed.
- Child home prefetches first 12 feed thumbnails + channel avatars on data load.

### 5. Infinite scroll / list performance
- **FlashList** on: Content Discovery, Video Feed, Channel Detail (parent + child).
- Shared tuning via `flatListConfig.ts` (`windowSize`, `maxToRenderPerBatch`, `removeClippedSubviews`, etc.).
- **Memoized rows:** `DiscoverMediaCard`, `DiscoverChannelCard`, `VideoCard`, `ChildChannelCard`, `ChildKidVideoCard`, `ChildLibraryList` rows.

### 6. React performance
- `React.memo` on all high-frequency card/row components.
- `useChildLibrary` hydrates from cache before network; `reload(true)` for silent refresh.
- Child home `useFocusEffect` silent library refresh (no spinner).
- Zustand selectors used for narrow subscriptions (`useAppStore((s) => s.activeChildId)`).

### 7. Network optimization
- In-flight GET deduplication (`getInflightRequestCount`).
- 401 token refresh with single retry.
- Cache-first + SWR for all read-heavy endpoints.
- Assign/remove invalidates `library:{childId}` and `feed:{childId}` keys.

### 8. Navigation optimization
- Lazy `getComponent` for `VideoPlayer`, `ChannelDetail`, `ChildChannelDetail`.
- Fade/slide animations preserved; previous tab state retained by React Navigation.

### 9. Offline support
- Persisted API cache survives app restarts.
- `useChildLibrary` falls back to cache on network error.
- Cached images remain visible (RN Image disk cache + prefetch).
- Cached videos playable when native cache has segments.

### 10. Memory / cleanup
- `CachedImage` cancels prefetch on unmount.
- Child home stops inline video on scroll/focus blur.
- Cache version bump evicts stale persisted entries on init.

### 11. Startup
- `CacheManager.init()` deferred alongside auth hydrate (non-blocking).
- Heavy screens lazy-loaded in navigator.

### 12. Cache management (Settings)
- Stats: memory/persisted entry counts, image hit/miss, video budget.
- Manual “Clear cached data” action.

---

## Before vs After (Expected)

| Scenario | Before | After |
|----------|--------|-------|
| Reopen child home | ~1–3 s spinner | Instant from cache; silent refresh |
| Scroll 200 discover videos | Occasional frame drops | FlashList + memo rows ≈ 60 FPS |
| Reopen watched video | Re-download/buffer | Native cache instant start |
| Thumbnail revisit | Network reload + flicker | Disk/memory hit, no flicker |
| Offline (previously viewed) | Error / empty | Cached API + images + video segments |
| Assign video to child | Stale library until restart | Cache invalidation + reload |
| Cold navigation to player | Eager bundle cost | Lazy screen load |

*Quantitative benchmarks depend on device/network; run Flipper/React DevTools Profiler on a mid-range Android device for project-specific numbers.*

---

## Dependencies Added

| Package | Why |
|---------|-----|
| `@shopify/flash-list` | Recycler-based lists; measurably smoother than FlatList at scale |

No other new dependencies. Uses existing `react-native-video`, `@react-native-async-storage/async-storage`.

---

## Known Limitations / Future Work

1. **Video LRU disk manager** — Native player cache is ~2 GB fixed; custom 2–5 GB LRU would need `react-native-blob-util` or similar for full control.
2. **Background video download** — Prefetch warms on first play; true background download queue not implemented.
3. **Remaining FlatLists** — Parent dashboard, search, favorites, watch history still use FlatList (lower traffic); can migrate if needed.
4. **Nested scroll on child home** — “For you” vertical section uses `.map()` inside `ScrollView`; acceptable for typical library sizes (<50). FlashList nested scroll if libraries grow large.
5. **Rebuild required** — Run `cd ios && pod install` and rebuild after FlashList install.

---

## Verification Checklist

- [ ] Child home: second visit shows content without spinner
- [ ] Discover: scroll 100+ items smoothly
- [ ] Channel detail: filter change keeps list visible during refresh
- [ ] Video player: reopen same video — instant playback
- [ ] Airplane mode: previously viewed child library still visible
- [ ] Settings → Clear cache → stats reset
- [ ] Assign/remove video → child library updates immediately

---

## Key Files

```
services/cache/          CacheManager, image/video cache, prefetch, list config
api/client.ts            SWR + dedupe
hooks/useChildLibrary.ts Cache-first child content
components/ui/CachedImage.tsx
screens/Child/ChildHomeScreen.tsx
screens/Parent/ContentDiscoveryScreen.tsx
screens/Child/VideoFeedScreen.tsx
screens/Shared/SettingsScreen.tsx
```
