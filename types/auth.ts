export type BackendUser = {
  id: string;
  firebaseUserId: string | null;
  email: string | null;
  displayName: string;
  provider: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  accessType?: 'FREE' | 'SUBSCRIPTION_REQUIRED';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegisterUserPayload = {
  firebaseUserId: string;
  name: string;
  email?: string;
  provider?: string;
  countryCode?: string;
  countryName?: string;
};
