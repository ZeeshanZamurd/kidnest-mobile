import { useContext } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useAppInsets } from './useAppInsets';
import { spacing } from '../theme/colors';

/**
 * Bottom inset for scroll content — tab bar height when inside a tab navigator,
 * otherwise safe-area bottom (stack / modal screens).
 */
export function useContentBottomPadding(extra = spacing.lg): number {
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const { bottom } = useAppInsets();

  if (typeof tabBarHeight === 'number') {
    return tabBarHeight + extra;
  }
  return bottom + extra;
}

/** @deprecated Prefer useContentBottomPadding — kept as alias for tab screens. */
export function useTabScreenPadding(extra = spacing.lg): number {
  return useContentBottomPadding(extra);
}

/** Scroll/list bottom padding on stack screens without a tab bar. */
export function useStackScreenPadding(extra = spacing.lg): number {
  const { bottom } = useAppInsets();
  return bottom + extra;
}

/** Tab bar height when inside a bottom-tab screen; 0 on stack screens. */
export function useOptionalBottomTabBarHeight(): number {
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  return typeof tabBarHeight === 'number' ? tabBarHeight : 0;
}
