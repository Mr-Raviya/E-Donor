import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
    Auth,
    getAuth,
    getReactNativePersistence,
    initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra ?? {};
const firebaseExtra = (extra as Record<string, any>).firebase ?? {};

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? firebaseExtra.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? firebaseExtra.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? firebaseExtra.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? firebaseExtra.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? firebaseExtra.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? firebaseExtra.appId,
};

if (!firebaseConfig.apiKey) {
  console.warn('Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* env vars or app.json extra.firebase.');
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Ensure React Native persistence uses AsyncStorage to avoid memory-only auth
let auth: Auth;
if (Platform.OS !== 'web') {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // initializeAuth may throw if already initialized; fall back to existing instance
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
