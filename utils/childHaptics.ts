import { Platform, Vibration } from 'react-native';

let hapticsEnabled = true;

/**
 * Soft tactile feedback for child UI.
 * Never throws — missing permission / unsupported devices are ignored.
 */
export function childTapHaptic(kind: 'tap' | 'select' | 'success' = 'tap'): void {
  if (!hapticsEnabled) return;

  try {
    if (Platform.OS === 'android') {
      const ms = kind === 'success' ? 18 : kind === 'select' ? 12 : 8;
      Vibration.vibrate(ms);
      return;
    }
    Vibration.vibrate();
  } catch {
    // Native SecurityException (no VIBRATE) can also surface via the bridge —
    // disable further attempts so the redbox doesn't keep firing.
    hapticsEnabled = false;
  }
}

/** Call if vibration fails at runtime so taps stay usable. */
export function disableChildHaptics(): void {
  hapticsEnabled = false;
}
