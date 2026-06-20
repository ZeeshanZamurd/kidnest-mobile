import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CHILD_TAB_BAR_CONTENT_HEIGHT,
  PARENT_TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_PADDING_BOTTOM_MIN,
  TAB_BAR_PADDING_TOP,
  tabBarHeight,
} from '../constants/layout';
import type { ThemeColors } from '../theme/colors';

export function useParentTabBarStyle(colors: ThemeColors) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, TAB_BAR_PADDING_BOTTOM_MIN);

  return {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBarBorder,
    height: tabBarHeight(PARENT_TAB_BAR_CONTENT_HEIGHT, insets.bottom),
    paddingTop: TAB_BAR_PADDING_TOP,
    paddingBottom,
    position: 'absolute' as const,
    elevation: 0,
  };
}

export function useChildTabBarStyle(colors: ThemeColors) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, TAB_BAR_PADDING_BOTTOM_MIN);

  return {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBarBorder,
    height: tabBarHeight(CHILD_TAB_BAR_CONTENT_HEIGHT, insets.bottom),
    paddingTop: TAB_BAR_PADDING_TOP,
    paddingBottom,
    position: 'absolute' as const,
    elevation: 0,
  };
}
