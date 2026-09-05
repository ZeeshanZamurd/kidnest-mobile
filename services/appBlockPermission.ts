import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { KidAlert } from './kidAlert';
import {
  hasAccessibilityPermission,
  isAppBlockSupported,
  openAccessibilitySettings,
} from './appBlockNative';

/** Set once the user has been shown the accessibility prompt (do not nag again). */
const PROMPT_KEY = '@kidnest/app-block-permission-prompted';
/** Set when we successfully detect accessibility as granted. */
const GRANTED_KEY = '@kidnest/app-block-accessibility-granted';

async function markGranted(): Promise<void> {
  await AsyncStorage.multiSet([
    [GRANTED_KEY, '1'],
    [PROMPT_KEY, '1'],
  ]);
}

async function markPromptShown(): Promise<void> {
  await AsyncStorage.setItem(PROMPT_KEY, '1');
}

/** Retry briefly — accessibility can reconnect a moment after process start. */
async function checkAccessibilityWithRetry(attempts = 4, delayMs = 400): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    if (await hasAccessibilityPermission()) {
      await markGranted();
      return true;
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

async function shouldShowPrompt(): Promise<boolean> {
  if (await checkAccessibilityWithRetry(2, 300)) {
    return false;
  }

  // Already asked once (granted or dismissed) — never auto-prompt again.
  const prompted = await AsyncStorage.getItem(PROMPT_KEY);
  if (prompted) return false;

  // Previously detected as granted; treat transient false as granted for prompting.
  const wasGranted = await AsyncStorage.getItem(GRANTED_KEY);
  if (wasGranted) return false;

  return true;
}

export function promptAppBlockPermission(options?: { force?: boolean }): void {
  if (!isAppBlockSupported) return;

  void (async () => {
    if (await checkAccessibilityWithRetry(options?.force ? 2 : 3, 350)) {
      return;
    }

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

/**
 * Soft watcher: ask at most once per install until granted.
 * Does not force-prompt on every app restart (that felt like permissions resetting).
 */
export function initAppBlockPermissionWatcher(): () => void {
  if (Platform.OS !== 'android' || !isAppBlockSupported) {
    return () => {};
  }

  const timeout = setTimeout(() => {
    void (async () => {
      const granted = await checkAccessibilityWithRetry();
      if (!granted) {
        promptAppBlockPermission();
      }
    })();
  }, 800);

  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    // Returning from Settings — refresh granted flag silently; never re-nag.
    void checkAccessibilityWithRetry(2, 250);
  });

  return () => {
    clearTimeout(timeout);
    sub.remove();
  };
}
