import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAppInsets } from './useAppInsets';
import { spacing } from '../theme/colors';

/** Scroll/list bottom padding inside a bottom-tab screen. */
export function useTabScreenPadding(extra = spacing.lg): number {
  return useBottomTabBarHeight() + extra;
}

/** Scroll/list bottom padding on stack screens without a tab bar. */
export function useStackScreenPadding(extra = spacing.lg): number {
  const { bottom } = useAppInsets();
  return bottom + extra;
}
