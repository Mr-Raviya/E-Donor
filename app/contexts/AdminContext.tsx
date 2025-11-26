import {
    User,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { AdminRecord, fetchAdminRecord } from '../services/adminService';

interface AdminSession {
  uid: string;
  email?: string;
  name?: string;
  role?: string;
}

interface AdminContextType {
  admin: AdminSession | null;
  isAdminAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshAdminStatus: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const buildAdminSession = (user: User, record: AdminRecord | null): AdminSession | null => {
  if (!record) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email ?? record.email,
    name: record.name ?? user.displayName ?? user.email ?? 'Admin',
    role: record.role ?? 'admin',
  };
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveAdminForUser = useCallback(async (user: User | null): Promise<AdminSession | null> => {
    if (!user?.uid) {
      setAdmin(null);
      return null;
    }
    try {
      const record = await fetchAdminRecord(user.uid);
      const adminSession = record ? buildAdminSession(user, record) : null;
      setAdmin(adminSession);
      return adminSession;
    } catch (error: any) {
      // Silently handle permission errors for normal users
      // Only log other types of errors
      if (!error.code?.includes('permission') && !error.message?.includes('permission')) {
        console.error('Failed to fetch admin record:', error);
      }
      setAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await resolveAdminForUser(firebaseUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [resolveAdminForUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const adminSession = await resolveAdminForUser(credential.user);
      if (!adminSession) {
        await firebaseSignOut(auth);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  }, [resolveAdminForUser]);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshAdminStatus = useCallback(async (): Promise<boolean> => {
    const adminSession = await resolveAdminForUser(auth.currentUser);
    return !!adminSession;
  }, [resolveAdminForUser]);

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdminAuthenticated: !!admin,
        login,
        logout,
        isLoading,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Added to silence Expo Router route warnings; this file is not a screen.
export default function IgnoreAdminRoute() {
  return null;
}
