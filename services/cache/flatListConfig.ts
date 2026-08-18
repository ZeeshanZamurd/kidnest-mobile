/** Shared FlatList tuning for 60 FPS scrolling. FlashList v2 uses `drawDistance` instead. */
export const LIST_PERFORMANCE = {
  initialNumToRender: 6,
  maxToRenderPerBatch: 8,
  updateCellsBatchingPeriod: 50,
  windowSize: 7,
  removeClippedSubviews: true,
} as const;

export const GRID_PERFORMANCE = {
  ...LIST_PERFORMANCE,
  initialNumToRender: 8,
  maxToRenderPerBatch: 10,
} as const;

export const FEED_PERFORMANCE = {
  initialNumToRender: 2,
  maxToRenderPerBatch: 2,
  updateCellsBatchingPeriod: 50,
  windowSize: 3,
  removeClippedSubviews: true,
} as const;

/** Shorts grid — 2 columns, fixed row height for getItemLayout. */
export function getShortsGridItemLayout(itemHeight: number, gap: number) {
  return (_: unknown, index: number) => ({
    length: itemHeight + gap,
    offset: (itemHeight + gap) * Math.floor(index / 2),
    index,
  });
}

/** Vertical full-screen feed pages. */
export function getVerticalPageLayout(pageHeight: number) {
  return (_: unknown, index: number) => ({
    length: pageHeight,
    offset: pageHeight * index,
    index,
  });
}
