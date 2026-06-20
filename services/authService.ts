import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { detectGeoLocation } from '../api/geo';
import { fetchUserByFirebaseUid, registerUser } from '../api/auth';
import { fetchPlatformAccess } from '../api/parent';
import { setApiAuthToken } from '../api/client';
import { firebaseAuth } from '../config/firebase';
import { clearAuthMeta } from './authStorage';
import type { BackendUser } from '../types/auth';
import type { PlatformAccess } from '../api/parent';

export type AuthSession = {
  firebaseUser: FirebaseUser;
  backendUser: BackendUser;
  idToken: string;
  platformAccess: PlatformAccess | null;
};

function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

function toAuthError(error: unknown, fallback: string): Error {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: string }).code);
    return new Error(mapFirebaseAuthError(code));
  }
  if (error instanceof Error && error.message) {
    return error;
  }
  return new Error(fallback);
}

export async function signUpParent(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const trimmedEmail = params.email.trim().toLowerCase();
  const trimmedName = params.name.trim();

  if (!trimmedName) {
    throw new Error('Please enter your full name.');
  }
  if (!trimmedEmail) {
    throw new Error('Please enter your email.');
  }
  if (params.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  let credential;
  try {
    credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      trimmedEmail,
      params.password,
    );
  } catch (error) {
    throw toAuthError(error, 'Could not create your account.');
  }

  const { user: firebaseUser } = credential;

  if (trimmedName !== firebaseUser.displayName) {
    await updateProfile(firebaseUser, { displayName: trimmedName });
  }

  let idToken = await firebaseUser.getIdToken();
  setApiAuthToken(idToken);

  const geo = await detectGeoLocation();

  const backendUser = await registerUser({
    firebaseUserId: firebaseUser.uid,
    name: trimmedName,
    email: trimmedEmail,
    provider: 'firebase',
    countryCode: geo?.country_code,
    countryName: geo?.country_name,
  });

  idToken = await firebaseUser.getIdToken(true);
  setApiAuthToken(idToken);

  return finishLogin(
    firebaseUser,
    {
      ...backendUser,
      displayName: backendUser.displayName?.trim() || trimmedName,
    },
    idToken,
  );
}

async function finishLogin(
  firebaseUser: FirebaseUser,
  backendUser: BackendUser,
  idToken: string,
): Promise<AuthSession> {
  let platformAccess: PlatformAccess | null = null;
  try {
    platformAccess = await fetchPlatformAccess();
  } catch {
    platformAccess = {
      hasAccess: backendUser.accessType === 'FREE' || !backendUser.accessType,
      accessType: backendUser.accessType ?? 'SUBSCRIPTION_REQUIRED',
      countryCode: backendUser.countryCode ?? null,
      countryName: backendUser.countryName ?? null,
      subscriptionStatus: null,
      canBrowseChannels: backendUser.accessType === 'FREE' || !backendUser.accessType,
      hasFullVideoAccess: backendUser.accessType === 'FREE' || !backendUser.accessType,
      freeVideoBrowseLimit:
        backendUser.accessType === 'FREE' || !backendUser.accessType ? null : 10,
      subscription: null,
    };
  }

  return { firebaseUser, backendUser, idToken, platformAccess };
}

export async function loginParent(params: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const trimmedEmail = params.email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new Error('Please enter your email.');
  }
  if (!params.password) {
    throw new Error('Please enter your password.');
  }

  let credential;
  try {
    credential = await signInWithEmailAndPassword(
      firebaseAuth,
      trimmedEmail,
      params.password,
    );
  } catch (error) {
    throw toAuthError(error, 'Could not sign you in.');
  }

  const { user: firebaseUser } = credential;
  let idToken = await firebaseUser.getIdToken();
  setApiAuthToken(idToken);

  const backendUser = await fetchUserByFirebaseUid(firebaseUser.uid);

  idToken = await firebaseUser.getIdToken(true);
  setApiAuthToken(idToken);

  const displayName =
    backendUser.displayName?.trim() ||
    firebaseUser.displayName?.trim() ||
    trimmedEmail.split('@')[0];

  return finishLogin(
    firebaseUser,
    { ...backendUser, displayName },
    idToken,
  );
}

export async function logoutParent(): Promise<void> {
  setApiAuthToken(null);
  await clearAuthMeta();
  await signOut(firebaseAuth);
}
