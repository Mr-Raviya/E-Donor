import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const USER_STORAGE_KEY = '@e_donor_user';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  bloodType: string;
  medicalNotes: string;
  profilePicture?: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  updateProfilePicture: (uri: string) => Promise<void>;
}

const defaultUser: UserProfile = {
  name: 'Kavishka Deshan',
  email: 'kavishka.deshan@email.com',
  phone: '+1 (555) 123-4567',
  location: 'Downtown, City',
  bloodType: 'O+',
  medicalNotes: 'No restrictions',
  profilePicture: undefined,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }, [user]);

  const updateProfilePicture = useCallback(async (uri: string) => {
    await updateUser({ profilePicture: uri });
  }, [updateUser]);

  return (
    <UserContext.Provider value={{ user, updateUser, updateProfilePicture }}>
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
