import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    User,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendEmailVerification,
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
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
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
  const clearDeactivationMessage = useCallback(() => setDeactivationMessage(null), []);

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
        console.log('🔄 syncProfileWithBackend called with:', { userId, fallback });
        
        const adminRecord = await fetchAdminRecord(userId);
        if (adminRecord) {
          setIsAdminAccount(true);
          return;
        }
        setIsAdminAccount(false);

        const remoteProfile = await fetchUserProfile(userId);
        console.log('📥 Fetched remote profile:', remoteProfile);

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
        
          // Profile exists - check if fallback has NEW data that's not already in the profile
          // Only merge if fallback has phone, location, or bloodType (signup data)
          const hasNewProfileData = fallback && (
            (fallback.phone && fallback.phone !== remoteProfile.phone) ||
            (fallback.location && fallback.location !== remoteProfile.location) ||
            (fallback.bloodType && fallback.bloodType !== remoteProfile.bloodType)
          );
          
          if (hasNewProfileData) {
            console.log('🔀 Merging existing profile with NEW fallback data');
            // Merge remote profile with new fallback data, only override with non-empty values
            const mergedProfile = {
              ...remoteProfile,
              ...(fallback.phone && { phone: fallback.phone }),
              ...(fallback.location && { location: fallback.location }),
              ...(fallback.bloodType && { bloodType: fallback.bloodType }),
              ...(fallback.name && { name: fallback.name }),
              ...(fallback.email && { email: fallback.email }),
            };
            
            console.log('📝 Merged profile to save:', mergedProfile);
            const updatedProfile = await upsertUserProfile(userId, mergedProfile);
            setUser(updatedProfile);
            return;
          }
          
          // No new data to merge, just load existing profile (normal login)
          console.log('✅ Loading existing profile (no changes needed)');
          setUser(remoteProfile);
          return;
        }

        // Create new profile with fallback data (for new users)
        console.log('🆕 Creating new profile for user');
        const profileData: Partial<UserProfile> = {
          name: fallback?.name || 'User',
          email: fallback?.email || '',
          phone: fallback?.phone || '',
          location: fallback?.location || '',
          bloodType: fallback?.bloodType || 'O+',
          medicalNotes: fallback?.medicalNotes || '',
          status: 'active',
          donationCount: 0,
          donorLevel: 'Bronze',
        };
        
        console.log('📝 New profile data to save:', profileData);
        const seededProfile = await upsertUserProfile(userId, profileData);
        console.log('✅ Profile created:', seededProfile);
        setUser(seededProfile);
      } catch (error) {
        console.error('❌ Failed to sync profile:', error);
        // Don't throw error to avoid uncaught promise rejection
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const bootstrap = async () => {
      await loadUserFromCache();

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        try {
          if (firebaseUser?.uid) {
            try {
              // Refresh user to get the latest verification status
              await firebaseUser.reload();
            } catch (reloadError) {
              console.error('Failed to reload user state:', reloadError);
            }

            if (!firebaseUser.emailVerified) {
              // Enforce email verification before allowing session
              await firebaseSignOut(auth);
              setSession(null);
              setUser(defaultUser);
              await AsyncStorage.removeItem(USER_STORAGE_KEY);
              setLoading(false);
              return;
            }

            setSession(firebaseUser);
            // Only pass email/name - syncProfileWithBackend will load existing profile
            // and only create new if none exists
            await syncProfileWithBackend(firebaseUser.uid, {
              email: firebaseUser.email ?? undefined,
              name: firebaseUser.displayName ?? undefined,
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

        if (session?.uid) {
          await upsertUserProfile(session.uid, updatedUser);
        }
      } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
      }
    },
    [session?.uid, user],
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
      const firebaseUser = credential.user;

      if (firebaseUser?.uid) {
        try {
          await firebaseUser.reload();
        } catch (reloadError) {
          console.error('Failed to reload user during sign in:', reloadError);
        }

        if (!firebaseUser.emailVerified) {
          await firebaseSignOut(auth);
          const verificationError: any = new Error(
            'Please verify your email before signing in. Tap "Resend Verification Email" to get a new link.',
          );
          verificationError.code = 'auth/email-not-verified';
          throw verificationError;
        }
        // Check if user account is deactivated
        const userProfile = await fetchUserProfile(firebaseUser.uid);
        if (userProfile?.status === 'inactive') {
          await firebaseSignOut(auth);
          throw new Error('Your account has been deactivated. Please contact support.');
        }
        
        await syncProfileWithBackend(firebaseUser.uid, {
          email: firebaseUser.email ?? email,
          name: firebaseUser.displayName ?? defaultUser.name,
        });
      }
    },
    [syncProfileWithBackend],
  );

  const resendVerificationEmail = useCallback(async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      if (!firebaseUser.emailVerified) {
        await sendEmailVerification(firebaseUser);
      }
    } finally {
      // Always sign out to avoid leaving an unverified session around
      await firebaseSignOut(auth);
    }
  }, []);

  const signUpWithPassword = useCallback(
    async (email: string, password: string, fullName?: string, profileExtras?: Partial<UserProfile>) => {
      try {
        console.log('🔵 Creating user account...');
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = credential.user;
        
        if (firebaseUser) {
          try {
            console.log('✉️ Sending email verification...');
            await sendEmailVerification(firebaseUser);
          } catch (verificationError) {
            console.error('❌ Failed to send verification email:', verificationError);
          }

          console.log('✅ User created with UID:', firebaseUser.uid);
          
          if (fullName) {
            console.log('📝 Setting display name:', fullName);
            await updateProfile(firebaseUser, { displayName: fullName });
          }
          
          // Save profile directly using upsertUserProfile (not syncProfileWithBackend)
          // This ensures data is saved while user is still authenticated
          const profileData: Partial<UserProfile> = {
            name: fullName ?? 'User',
            email: email,
            phone: profileExtras?.phone || '',
            location: profileExtras?.location || '',
            bloodType: profileExtras?.bloodType || 'O+',
            medicalNotes: profileExtras?.medicalNotes || '',
            status: 'active',
            donationCount: 0,
            donorLevel: 'Bronze',
          };
          
          console.log('💾 Saving profile data directly:', profileData);
          try {
            await upsertUserProfile(firebaseUser.uid, profileData);
            console.log('✅ Profile saved successfully!');
          } catch (profileError) {
            console.error('❌ Failed to save profile:', profileError);
            // Continue with signup even if profile save fails - user can update later
          }
          
          console.log('✅ Sign up completed successfully!');

          // Sign out to enforce verification before first login
          await firebaseSignOut(auth);
          setSession(null);
          setUser(defaultUser);
          await AsyncStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }
    },
    [],
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
        deactivationMessage,
        clearDeactivationMessage,
        refreshProfile,
        updateUser,
        updateProfilePicture,
        signInWithPassword,
        resendVerificationEmail,
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

// Added to silence Expo Router route warnings; this file is not a screen.
export default function IgnoreUserRoute() {
  return null;
}
