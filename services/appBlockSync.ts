import {
  applyBlockedPackagesOnDevice,
  setAppBlockMonitoring,
} from './appBlockNative';

export function applyDeviceBlockList(packageNames: string[]): void {
  applyBlockedPackagesOnDevice(packageNames);
}

export function enableChildModeBlocking(packageNames: string[]): void {
  applyBlockedPackagesOnDevice(packageNames);
  setAppBlockMonitoring(packageNames.length > 0);
}

export function disableChildModeBlocking(): void {
  setAppBlockMonitoring(false);
}
