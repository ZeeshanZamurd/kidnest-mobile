import { NativeModules, Platform } from 'react-native';

type OrientationModule = {
  lockToPortrait?: () => void;
  lockToLandscape?: () => void;
  unlockAllOrientations?: () => void;
};

const nativeOrientation = NativeModules.Orientation as OrientationModule | undefined;

const hasNativeOrientation =
  Platform.OS !== 'web' &&
  nativeOrientation != null &&
  typeof nativeOrientation.lockToPortrait === 'function';

export function lockToPortrait(): void {
  if (!hasNativeOrientation) return;
  nativeOrientation?.lockToPortrait?.();
}

export function lockToLandscape(): void {
  if (!hasNativeOrientation) return;
  nativeOrientation?.lockToLandscape?.();
}

export function unlockAllOrientations(): void {
  if (!hasNativeOrientation) return;
  nativeOrientation?.unlockAllOrientations?.();
}

export function isOrientationLockAvailable(): boolean {
  return hasNativeOrientation;
}
