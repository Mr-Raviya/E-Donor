import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    User,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { fetchAdminRecord } from '../services/adminService';
import { fetchUserProfile, upsertUserProfile } from '../services/profileService';
import { UserProfile } from '../types/user';

const USER_STORAGE_KEY = '@e_donor_user';

interface UserContextType {
  user: UserProfile;
  session: User | null;
  loading: boolean;
  deactivationMessage: string | null;
  clearDeactivationMessage: () => void;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  updateProfilePicture: (uri: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string,
    profileExtras?: Partial<UserProfile>,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultUser: UserProfile = {
  name: 'User',
  email: 'user@email.com',
  phone: '0771234567',
  location: 'City',
  bloodType: 'O+',
  medicalNotes: 'No restrictions',
  profilePicture: undefined,
  donorLevel: 'Gold',
  lastDonationDate: undefined,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [deactivationMessage, setDeactivationMessage] = useState<string | null>(null);

  const cacheUserLocally = useCallback(async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to cache user locally:', error);
    }
  }, []);

  const loadUserFromCache = useCallback(async () => {
    try {
      const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to load cached user:', error);
    }
  }, []);

  const syncProfileWithBackend = useCallback(
    async (userId: string, fallback?: Partial<UserProfile>) => {
      try {
        const adminRecord = await fetchAdminRecord(userId);
        if (adminRecord) {
          setIsAdminAccount(true);
          return;
        }
        setIsAdminAccount(false);

        const remoteProfile = await fetchUserProfile(userId);

        if (remoteProfile) {
          // Check if account is deactivated
          if (remoteProfile.status === 'inactive') {
            // Sign out user if their account has been deactivated
            await firebaseSignOut(auth);
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
            setUser(defaultUser);
            setSession(null);
            return;
          }
          
          // Profile exists, load it
          setUser(remoteProfile);
          await cacheUserLocally(remoteProfile);
          return;
        }

        // Create new profile with fallback data (for new users)
        // Merge defaultUser with fallback to ensure all required fields are present
        const profileData = {
          ...defaultUser,
          ...fallback, // Override with actual user data
        };
        
        const seededProfile = await upsertUserProfile(userId, profileData);
        setUser(seededProfile);
        await cacheUserLocally(seededProfile);
      } catch (error) {
        console.error('Failed to sync profile:', error);
        // Don't throw error to avoid uncaught promise rejection
      }
    },
    [cacheUserLocally],
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const bootstrap = async () => {
      await loadUserFromCache();

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        try {
          setSession(firebaseUser);
          if (firebaseUser?.uid) {
            await syncProfileWithBackend(firebaseUser.uid, {
              email: firebaseUser.email ?? undefined,
              name: firebaseUser.displayName ?? defaultUser.name,
            });
          } else {
            setUser(defaultUser);
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
          }
          setLoading(false);
        } catch (error) {
          console.error('Error in auth state change:', error);
          setLoading(false);
        }
      });
    };

    bootstrap().catch((error) => {
      console.error('Failed to bootstrap session:', error);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [loadUserFromCache, syncProfileWithBackend]);

  const refreshProfile = useCallback(async () => {
    if (session?.uid && !isAdminAccount) {
      await syncProfileWithBackend(session.uid);
    }
  }, [isAdminAccount, session?.uid, syncProfileWithBackend]);

  const updateUser = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (isAdminAccount) {
        return;
      }
      try {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await cacheUserLocally(updatedUser);

        if (session?.uid) {
          await upsertUserProfile(session.uid, updatedUser);
        }
      } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
      }
    },
    [cacheUserLocally, session?.uid, user],
  );

  const updateProfilePicture = useCallback(
    async (uri: string) => {
      if (isAdminAccount) {
        return;
      }
      await updateUser({ profilePicture: uri });
    },
    [isAdminAccount, updateUser],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (credential.user?.uid) {
        // Check if user account is deactivated
        const userProfile = await fetchUserProfile(credential.user.uid);
        if (userProfile?.status === 'inactive') {
          await firebaseSignOut(auth);
          throw new Error('Your account has been deactivated. Please contact support.');
        }
        
        await syncProfileWithBackend(credential.user.uid, {
          email: credential.user.email ?? email,
          name: credential.user.displayName ?? defaultUser.name,
        });
      }
    },
    [syncProfileWithBackend],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, fullName?: string, profileExtras?: Partial<UserProfile>) => {
      try {
        console.log('🔵 Creating user account...');
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = credential.user;
        
        if (firebaseUser) {
          console.log('✅ User created with UID:', firebaseUser.uid);
          
          if (fullName) {
            console.log('📝 Setting display name:', fullName);
            await updateProfile(firebaseUser, { displayName: fullName });
          }
          
          console.log('💾 Saving profile data:', { email, name: fullName, ...profileExtras });
          await syncProfileWithBackend(firebaseUser.uid, {
            email,
            name: fullName ?? defaultUser.name,
            ...profileExtras,
          });
          
          console.log('✅ Sign up completed successfully!');
        }
      } catch (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }
    },
    [syncProfileWithBackend],
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setSession(null);
    setUser(defaultUser);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        loading,
        refreshProfile,
        updateUser,
        updateProfilePicture,
        signInWithPassword,
        signUpWithPassword,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
