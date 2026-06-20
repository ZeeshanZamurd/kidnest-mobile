import type { BackendUser, RegisterUserPayload } from '../types/auth';
import { apiRequest } from './client';

export function registerUser(payload: RegisterUserPayload): Promise<BackendUser> {
  return apiRequest<BackendUser>('/users', 'POST', { body: payload });
}

export function fetchUserByFirebaseUid(firebaseUserId: string): Promise<BackendUser> {
  return apiRequest<BackendUser>(`/users/${firebaseUserId}`, 'GET');
}
