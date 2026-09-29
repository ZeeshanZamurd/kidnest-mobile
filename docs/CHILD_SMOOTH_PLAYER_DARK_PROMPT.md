# Prompt: Child UX polish — alignment, dark mode, YouTube-smooth player

## Goal
Make the **child experience** feel seamless and theme-consistent: channel rail stays aligned, dark mode is controllable from child home, and opening a video feels like **YouTube** (instant player chrome + in-frame loader — never a blank white/lavender full-screen flash).

## Problems to fix
1. **Channel rail misalignment** — compact channel cards with 1-line vs 2-line titles shift hearts/row bottoms.
2. **No dark-mode control on child home** — theme is global but only toggled in parent Settings; child users (and parents testing as child) need a clear moon/sun control on child home.
3. **Video open flash** — `VideoPlayerScreen` loading/error/background use hardcoded light lavender (`#F7F4FF` / `#FFF9FC`). In dark mode this is a jarring white screen before play.
4. **Loader placement** — full-screen spinner instead of YouTube-style: navigate immediately into player layout; spinner/poster lives **inside** the 16:9 video frame; detail area can soft-load.
5. **Suggested / For You feel** — avoid empty jumps; keep home progressive reveal smooth; player “suggested for you” chrome must respect dark theme.

## Product principles (senior bar)
1. **Zero flash** — first paint of VideoPlayer must match current theme (`colors.background` / dark slate), never light-only gradients.
2. **Instant shell** — on tap, push player with optional `title` + `thumbnailUrl` preview params; show poster + in-frame loader while `fetchVideoById` runs.
3. **Theme everywhere under the player** — header back chip, detail panel cards, text, chips use `useTheme()` (same language as child landing / `GradientBackground` dark child).
4. **Stable layout** — channel rail reserves fixed height for 2-line names so hearts align.
5. **Child can toggle dark mode** — one obvious control next to switch-profile on child home hero; uses existing `ThemeContext.toggleTheme` (same AsyncStorage key).
6. **Do not break parent player** — same screen; theme-aware for both roles; shorts immersive path stays black.

## Implementation checklist

### A. Channel rail (`ChildChannelCard` compact)
- Fixed slot for name: `minHeight` (or height) = `2 * lineHeight` (e.g. 30).
- Keep avatar → name slot → heart vertical order; hearts align across the row.
- Optional: `alignItems: 'flex-start'` on the horizontal FlatList content if needed.

### B. Child home dark toggle (`ChildHomeScreen`)
- Add moon / sunny icon button beside switch-profile.
- `toggleTheme` + `isDark` from `useTheme()`; haptic on press.
- Labels: accessibility `Dark mode` / `Light mode`.

### C. YouTube-smooth VideoPlayer (`VideoPlayerScreen` + nav types)
- Extend params: `VideoPlayer: { videoId: string; title?: string; thumbnailUrl?: string }`.
- Pass preview from child open paths (`ChildHomeScreen`, `childVideoNavigation`, channel detail when available).
- **Remove** full-screen light `LinearGradient` loading gate.
- While `!video`: render themed screen + header + player frame with `VideoPosterLoader` (if thumbnail) or dark frame + spinner; show soft title if provided; surface errors without white wash.
- Main screen gradient / solid bg = theme colors (short parent layout can stay black).
- Header back: theme surface / readable icon (not hardcoded white glass + purple).

### D. Detail panel theme (`VideoDetailPanel`)
- Replace hardcoded white/lavender cards and purple text with `colors.card`, `colors.surface`, `colors.text`, `colors.textMuted`, `colors.border`, `colors.primary`.
- Blur: `dark` when `isDark`, else `light`.
- Suggested shelf / up-next cards readable in both themes.

### E. Suggested / For You smoothness
- Keep progressive For You windowing on home (no full-list hitch).
- Do not hide entire home behind white flash when opening a video.
- If library still loading, `ChildHomeSkeleton` is fine; after load, empty shelves stay hidden (existing) — no layout thrash.

## Out of scope
- API / admin changes.
- New theme storage keys.
- Redesigning shorts `VideoFeedScreen` (already dark).
- Parent Settings removal (keep that toggle too).

## Success criteria
- [ ] Channel names with 2 lines do not push hearts out of alignment vs 1-line neighbors.
- [ ] Child home has a working dark/light toggle; landing and player share the same dark/light feel.
- [ ] Tapping a video never shows a full white/lavender loading screen.
- [ ] First paint is player-shaped: dark/theme bg + thumbnail/loader in the video rectangle.
- [ ] Suggested-for-you / detail under player readable in dark mode.
- [ ] Motion feels continuous — like YouTube — not a reload flash.

## Files (primary)
- `components/discover/ChildChannelCard.tsx`
- `screens/Child/ChildHomeScreen.tsx`
- `screens/Shared/VideoPlayerScreen.tsx`
- `components/video/VideoDetailPanel.tsx`
- `navigation/types.ts`
- `utils/childVideoNavigation.ts`
