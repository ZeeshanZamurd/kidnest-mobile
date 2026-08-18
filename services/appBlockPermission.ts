import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { KidAlert } from './kidAlert';
import {
  hasAccessibilityPermission,
  isAppBlockSupported,
  openAccessibilitySettings,
} from './appBlockNative';

const PROMPT_KEY = '@kidnest/app-block-permission-prompted';

async function shouldShowPrompt(): Promise<boolean> {
  const granted = await hasAccessibilityPermission();
  if (granted) {
    await AsyncStorage.removeItem(PROMPT_KEY);
    return false;
  }
  const last = await AsyncStorage.getItem(PROMPT_KEY);
  if (!last) return true;
  // Re-prompt if dismissed more than 6 hours ago and still not granted.
  const elapsed = Date.now() - Number(last);
  return Number.isFinite(elapsed) && elapsed > 6 * 60 * 60 * 1000;
}

async function markPromptShown(): Promise<void> {
  await AsyncStorage.setItem(PROMPT_KEY, String(Date.now()));
}

export function promptAppBlockPermission(options?: { force?: boolean }): void {
  if (!isAppBlockSupported) return;

  void (async () => {
    const granted = await hasAccessibilityPermission();
    if (granted) return;

    if (!options?.force) {
      const show = await shouldShowPrompt();
      if (!show) return;
    }

    await markPromptShown();

    KidAlert.alert(
      'Enable app blocking',
      'KidNest needs Accessibility permission to block apps for your child. Tap Continue to open Settings, then enable KidNest.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            setTimeout(() => {
              void openAccessibilitySettings();
            }, 200);
          },
        },
      ],
    );
  })();
}

export function initAppBlockPermissionWatcher(): () => void {
  if (Platform.OS !== 'android' || !isAppBlockSupported) {
    return () => {};
  }

  const timeout = setTimeout(() => {
    void (async () => {
      const granted = await hasAccessibilityPermission();
      if (!granted) {
        promptAppBlockPermission({ force: true });
      }
    })();
  }, 600);

  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    void hasAccessibilityPermission().then((granted) => {
      if (!granted) {
        promptAppBlockPermission();
      } else {
        void AsyncStorage.removeItem(PROMPT_KEY);
      }
    });
  });

  return () => {
    clearTimeout(timeout);
    sub.remove();
  };
}
