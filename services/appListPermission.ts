import { KidAlert } from './kidAlert';
import {
  hasAppListPermission,
  isAppBlockSupported,
  openAppListPermissionSettings,
  requestAppListPermission,
} from './appBlockNative';

/** Only call from Block apps screen when user taps Allow — not on app launch. */
export async function ensureAppListPermission(): Promise<boolean> {
  if (!isAppBlockSupported) return false;

  if (await hasAppListPermission()) return true;

  try {
    return await requestAppListPermission();
  } catch {
    return false;
  }
}

export function promptAppListPermission(): void {
  if (!isAppBlockSupported) return;

  void (async () => {
    if (await hasAppListPermission()) return;

    KidAlert.alert(
      'Allow app list access',
      'KidNest needs permission to see installed apps. Tap Open settings, allow Read app list for KidNest, then pull down to refresh.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Open settings',
          onPress: () => {
            setTimeout(() => {
              void openAppListPermissionSettings();
            }, 200);
          },
        },
      ],
    );
  })();
}
