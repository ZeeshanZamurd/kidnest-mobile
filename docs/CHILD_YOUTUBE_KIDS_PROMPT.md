# Prompt: KidNest Child Home — YouTube Kids–style redesign

## Goal
Make the **child-side app** feel like **YouTube Kids**: warm, playful, easy to tap, smooth, and delightful — with **light haptic feedback** for accessibility and confidence on every important tap.

## Product principles
1. **One glance understanding** — big thumbnails, big play bubbles, emoji section headers; minimal reading required.
2. **Fat-finger friendly** — tap targets ≥ 48pt; cards spring on press; generous spacing.
3. **Soft feedback** — short haptic (vibration) on: open video, favorite, switch profile, tab change. Never harsh / long buzzes.
4. **Smooth motion** — Reanimated springs + short fade-ins; no janky layout jumps.
5. **Safe & assigned-only** — keep existing library/feed data; do not show unassigned content.
6. **Preserve KidNest brand** — use existing child gradients / `ChildKidVideoCard` / `ChildColorSection` (not a flat adult list).

## Visual direction (YouTube Kids–inspired)
- Hero greeting: large avatar + “Hi, {name}!” + short friendly line.
- Horizontal shelves: Continue Watching → Suggested → My Channels → For You.
- Color-block section headers with emoji (already in `ChildColorSection`).
- Video tiles: glossy frames, big centered play, progress bar, optional heart; **title under tile**.
- Channels: large circular avatars in a horizontal row (YouTube Kids channel rail).
- Bottom tabs: playful scale + soft haptic on focus change.
- Empty / error: friendly illustration-style copy, big retry button.

## Accessibility
- `accessibilityLabel` on all primary taps (video title, channel name, tabs).
- Light vibration only (Android ~8–15ms; iOS best-effort short buzz).
- High-contrast play controls and duration pills.
- Do not rely on color alone for favorites (filled vs outline heart).

## Out of scope
- Parent screens, admin, API.
- Full player redesign (keep current kid player pieces).
- New native haptic libraries (use RN `Vibration` helper).

## Success criteria
- Child home no longer looks like the parent Discover list (`VideoCard`).
- Opening videos / favoriting / switching tabs feels springy + lightly haptic.
- Layout works on phone portrait; shelves scroll smoothly.
