import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';

/** Central safe-area values for consistent layout across the app. */
export function useAppInsets() {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    /** Top offset for screen headers below the status bar. */
    headerTop: insets.top + spacing.md,
    /** Bottom padding for fixed footers (Next, Continue, etc.). */
    footerBottom: insets.bottom + spacing.lg,
    /** Bottom padding for scroll content on stack screens (no tab bar). */
    stackBottom: insets.bottom + spacing.lg,
  };
}
