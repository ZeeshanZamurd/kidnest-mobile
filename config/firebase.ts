import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error RN persistence is exported at runtime in Firebase 12+
  getReactNativePersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC7U9gsUeMDQkLudnz0FRJVilEIsJRB5eI',
  authDomain: 'kidnest-2720e.firebaseapp.com',
  projectId: 'kidnest-2720e',
  storageBucket: 'kidnest-2720e.firebasestorage.app',
  messagingSenderId: '1046109146386',
  appId: '1:1046109146386:web:228b10699283de0469b7cb',
  measurementId: 'G-ZSRMTTNN66',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const firebaseAuth = createAuth();
