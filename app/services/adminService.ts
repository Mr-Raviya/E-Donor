import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const ADMIN_COLLECTION = 'admins';

export interface AdminRecord {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

const mapSnapshotToAdmin = (userId: string, data?: Record<string, any>): AdminRecord => ({
  id: userId,
  name: data?.name ?? data?.full_name ?? undefined,
  email: data?.email ?? undefined,
  role: data?.role ?? undefined,
});

export const fetchAdminRecord = async (userId: string): Promise<AdminRecord | null> => {
  if (!userId) {
    return null;
  }
  const snapshot = await getDoc(doc(db, ADMIN_COLLECTION, userId));
  if (!snapshot.exists()) {
    return null;
  }
  return mapSnapshotToAdmin(userId, snapshot.data());
};

export const isAdminUser = async (userId: string): Promise<boolean> => {
  const record = await fetchAdminRecord(userId);
  return record !== null;
};
