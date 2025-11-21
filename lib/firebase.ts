import Constants from 'expo-constants';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
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

const hasInitializedApp = getApps().length > 0;
const app = hasInitializedApp ? getApp() : initializeApp(firebaseConfig);

const isWeb = Platform.OS === 'web';
export const auth = !isWeb
  ? hasInitializedApp
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
  : getAuth(app);
export const db = getFirestore(app);
