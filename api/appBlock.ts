import { apiRequest } from './client';

export type BlockedAppRecord = {
  id: string;
  packageName: string;
  appLabel: string;
  createdAt: string;
};

export type InstalledApp = {
  packageName: string;
  appLabel: string;
};

export async function fetchChildBlockedApps(childId: string) {
  return apiRequest<BlockedAppRecord[]>(`/parents/children/${childId}/blocked-apps`, 'GET');
}

export async function updateChildBlockedApps(
  childId: string,
  apps: { packageName: string; appLabel: string }[],
) {
  return apiRequest<BlockedAppRecord[]>(`/parents/children/${childId}/blocked-apps`, 'PUT', {
    body: { apps },
  });
}
