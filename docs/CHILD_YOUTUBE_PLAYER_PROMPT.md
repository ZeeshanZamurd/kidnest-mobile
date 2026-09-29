# Prompt: Child VideoPlayer — YouTube-smooth play, buffer, controls, end suggestions

## Goal
Make the **child long-form player** behave like **YouTube**:
- Video **autoplays** on open.
- Loading / slow-network buffering shows a **spinner inside the video frame** (initial + mid-playback).
- Chrome (controls / progress) **auto-hides**; tap **shows/hides** like YouTube — not permanent suggestion UI during play.
- **Suggestions stay out of the way while watching**; at **end**, show next/suggested videos **on the video** (end screen), sourced from **all channels in the child’s list**.
- **Autoplay next** works like YouTube (countdown → next, cancelable).

## Product rules
1. **Play first** — opening a video starts playback as soon as the stream is ready (`paused = false` for child; respect parent `autoplayEnabled` for *next* video).
2. **Loader in-frame only** — never a full white page; poster + spinner until first frame; YouTube-style spinner when rebuffering mid-video.
3. **Controls = chrome** — while playing, hide controls after ~3–4s; tap video toggles chrome visibility; play/pause via center/dock button when chrome is visible.
4. **No suggestion shelf under the player during active playback** — remove always-on inline shelf. Related list can live below in the scroll panel (secondary) or only when paused/ended.
5. **End screen on the player** — when video ends (or during autoplay countdown): overlay with “Up next” + grid/row of suggestions from **full child feed** (all assigned channels). Tap a tile → play that video. Autoplay next after short countdown if enabled.
6. **Suggestion pool** — keep `getRelatedVideos` / `getNextVideo` over entire `feedVideos` (all assigned channels), not current channel only.
7. **Shorts unchanged** — vertical feed path stays as-is.

## Implementation checklist

### A. Autoplay on open
- Child: ensure `paused` starts `false` and `resetPlayback` keeps autoplay intent.
- `autoplayEnabled` continues to gate **autoplay next** + end countdown.

### B. Mid-buffer + initial loader
- `utils/videoBuffering.ts`: allow mid-playback buffering UI (remove/raise `currentTime > 0.25` kill-switch).
- `VideoPlayerScreen` `onBuffer`: always update `isBuffering`.
- `VideoPlayerOverlay`: show `PlayerBufferingOverlay` when buffering **after** first frame too (not only cold start); keep `VideoPosterLoader` for pre-first-frame / switch.

### C. Controls hide / show (YouTube)
- Tap on video: if controls hidden → show; if visible → hide (do **not** toggle play on blank tap).
- Play/pause only via explicit control.
- Auto-hide while playing (~3–4s); stay visible when paused, seeking, or end overlay open.

### D. Hide suggestions during play
- Remove always-visible inline `PlayerVideoShelf` under portrait player while playing.
- Optional: show a compact “Up next” / related row only when `paused` or `ended`, or keep related only in scroll `VideoDetailPanel`.

### E. End overlay + autoplay next
- State: `ended`, `autoplayCountdown` (e.g. 5s).
- `handleVideoEnd`:
  - If child + `autoplayEnabled` + `nextVideo`: set ended, start countdown overlay on player; at 0 → `goToVideo(next)`; tap Cancel / X cancels and keeps end suggestions.
  - Else: pause + show end suggestions overlay (no auto jump).
- Overlay content: next video highlight + list from `shelfVideos` / related (all child channels).
- Clear `ended` / countdown in `resetPlayback` / when starting a new video.
- Reuse or lightly adapt `PlayerVideoShelf` overlay / `KidUpNextCapsule` if useful.

### F. Detail panel
- Up Next / suggested below the fold OK as secondary browse.
- Do not duplicate a loud horizontal shelf glued under the frame during play.

## Success criteria
- [ ] Open video → plays automatically (no extra Play tap required once buffered).
- [ ] Slow network: spinner appears in the video rectangle initially and when playback stalls mid-video.
- [ ] Controls auto-hide; tap shows/hides chrome; suggestions are not stuck under the player while watching.
- [ ] On end: YouTube-like end/next UI on the video; suggestions from all child-assigned channels.
- [ ] Autoplay next countdown works and is cancelable; then next video plays smoothly.

## Primary files
- `docs/CHILD_YOUTUBE_PLAYER_PROMPT.md` (this file)
- `screens/Shared/VideoPlayerScreen.tsx`
- `components/video/player/VideoPlayerOverlay.tsx`
- `utils/videoBuffering.ts`
- `components/video/player/PlayerBufferingOverlay.tsx` (if gates need tweak)
- `components/video/player/PlayerVideoShelf.tsx` / `components/child/player/KidUpNextCapsule.tsx` (end UI)
- `hooks/useChildLibrary.ts` / `utils/videoSuggestions.ts` (confirm all-channel pool)
