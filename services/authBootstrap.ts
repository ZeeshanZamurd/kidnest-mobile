import { onAuthStateChanged, onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { fetchUserByFirebaseUid } from '../api/auth';
import { setApiAuthToken } from '../api/client';
import { fetchPlatformAccess } from '../api/parent';
import { firebaseAuth } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';
import type { BackendUser } from '../types/auth';
import type { PlatformAccess } from '../api/parent';
import { clearAuthMeta, loadAuthMeta, saveAuthMeta } from './authStorage';
import { loadParentChildren, resetParentChildrenCache } from './parentChildrenCache';

async function buildPlatformAccess(backendUser: BackendUser): Promise<PlatformAccess | null> {
  try {
    return await fetchPlatformAccess();
  } catch {
    const isFree = backendUser.accessType === 'FREE' || !backendUser.accessType;
    return {
      hasAccess: isFree,
      accessType: backendUser.accessType ?? 'SUBSCRIPTION_REQUIRED',
      countryCode: backendUser.countryCode ?? null,
      countryName: backendUser.countryName ?? null,
      subscriptionStatus: null,
      canBrowseChannels: true,
      canAssignChannels: false,
      hasFullVideoAccess: false,
      freeMaxAssignments: 10,
      freeVideoBrowseLimit: isFree ? null : 10,
      subscription: null,
    };
  }
}

export async function restoreSessionFromFirebaseUser(firebaseUser: FirebaseUser): Promise<void> {
  const idToken = await firebaseUser.getIdToken();
  setApiAuthToken(idToken);

  const [backendUser, platformAccess] = await Promise.all([
    fetchUserByFirebaseUid(firebaseUser.uid),
    fetchPlatformAccess().catch(() => null),
  ]);

  const resolvedAccess =
    platformAccess ?? (await buildPlatformAccess(backendUser));

  const meta = await loadAuthMeta();
  const store = useAppStore.getState();

  store.setParentSession({ backendUser, idToken }, resolvedAccess);

  if (meta.hasOnboarded) {
    store.setOnboarded(true);
  }

  void loadParentChildren();
}

export async function refreshIdToken(force = true): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;

  const idToken = await user.getIdToken(force);
  setApiAuthToken(idToken);

  const { parentSession, platformAccess, setParentSession } = useAppStore.getState();
  if (parentSession) {
    setParentSession({ ...parentSession, idToken }, platformAccess);
  }

  return idToken;
}

export async function persistCurrentAuthMeta(): Promise<void> {
  const { hasOnboarded } = useAppStore.getState();
  await saveAuthMeta({ hasOnboarded });
}

export async function handleAuthSignedOut(): Promise<void> {
  resetParentChildrenCache();
  setApiAuthToken(null);
  await clearAuthMeta();
  useAppStore.getState().logout();
}

/**
 * Restores Firebase session on cold start, keeps tokens fresh, and signs out on auth loss.
 * `onReady` fires as soon as Firebase reports auth state — session restore continues in background.
 */
export function initAuthListeners(onReady: () => void): () => void {
  let ready = false;

  const finishReady = () => {
    if (ready) return;
    ready = true;
    onReady();
  };

  const unsubAuth = onAuthStateChanged(firebaseAuth, (user) => {
    if (!ready) {
      finishReady();
      if (user) {
        void restoreSessionFromFirebaseUser(user).catch(() => {
          setApiAuthToken(null);
        });
      } else {
        void loadAuthMeta().then((meta) => {
          if (meta.hasOnboarded) {
            useAppStore.getState().setOnboarded(true);
          }
        });
      }
      return;
    }

    if (!user) {
      void handleAuthSignedOut();
    }
  });

  const unsubToken = onIdTokenChanged(firebaseAuth, (user) => {
    if (!user) return;
    void refreshIdToken(false);
  });

  return () => {
    unsubAuth();
    unsubToken();
  };
}
