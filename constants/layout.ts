/** Inner tab bar row height (icons + labels), excluding vertical padding and system inset. */
export const PARENT_TAB_BAR_CONTENT_HEIGHT = 48;
export const CHILD_TAB_BAR_CONTENT_HEIGHT = 50;

export const TAB_BAR_PADDING_TOP = 8;
export const TAB_BAR_PADDING_BOTTOM_MIN = 8;

export function tabBarHeight(contentHeight: number, bottomInset: number): number {
  const paddingBottom = Math.max(bottomInset, TAB_BAR_PADDING_BOTTOM_MIN);
  return contentHeight + TAB_BAR_PADDING_TOP + paddingBottom;
}
