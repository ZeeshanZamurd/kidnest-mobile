import { Linking, NativeModules, Platform } from 'react-native';
import type { InstalledApp } from '../api/appBlock';

type AppBlockNative = {
  getInstalledApps: () => Promise<InstalledApp[]>;
  getDeviceInfo: () => Promise<{ manufacturer: string; brand: string; model: string }>;
  hasAppListPermission: () => Promise<boolean>;
  requestAppListPermission: () => Promise<boolean>;
  openAppListPermissionSettings: () => Promise<boolean>;
  hasAccessibilityPermission: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<boolean>;
  setBlockedPackages: (packages: string[]) => void;
  setMonitoringEnabled: (enabled: boolean) => void;
  isMonitoringEnabled: () => Promise<boolean>;
};

const Native: AppBlockNative | undefined = NativeModules.KidNestAppBlock;

export const isAppBlockSupported = Platform.OS === 'android' && Native != null;

export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (!Native) return [];
  return Native.getInstalledApps();
}

export async function hasAccessibilityPermission(): Promise<boolean> {
  if (!Native) return false;
  return Native.hasAccessibilityPermission();
}

export async function getAppBlockDeviceInfo(): Promise<{
  manufacturer: string;
  brand: string;
  model: string;
} | null> {
  if (!Native?.getDeviceInfo) return null;
  try {
    return await Native.getDeviceInfo();
  } catch {
    return null;
  }
}

export async function hasAppListPermission(): Promise<boolean> {
  if (!Native?.hasAppListPermission) return true;
  try {
    return await Native.hasAppListPermission();
  } catch {
    return false;
  }
}

export async function requestAppListPermission(): Promise<boolean> {
  if (!Native?.requestAppListPermission) return true;
  try {
    return await Native.requestAppListPermission();
  } catch {
    return false;
  }
}

export async function openAppListPermissionSettings(): Promise<boolean> {
  if (Native?.openAppListPermissionSettings) {
    try {
      await Native.openAppListPermissionSettings();
      return true;
    } catch {
      // Fall through.
    }
  }

  if (Platform.OS === 'android') {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export async function openAccessibilitySettings(): Promise<boolean> {
  if (Native?.openAccessibilitySettings) {
    try {
      await Native.openAccessibilitySettings();
      return true;
    } catch {
      // Fall through to Linking fallback.
    }
  }

  if (Platform.OS === 'android') {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export function applyBlockedPackagesOnDevice(packageNames: string[]): void {
  Native?.setBlockedPackages(packageNames);
}

export function setAppBlockMonitoring(enabled: boolean): void {
  Native?.setMonitoringEnabled(enabled);
}

export async function isAppBlockMonitoring(): Promise<boolean> {
  if (!Native) return false;
  return Native.isMonitoringEnabled();
}
