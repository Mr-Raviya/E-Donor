import {
  addDoc,
  collection,
  doc,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type UserDonation = {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodType: string;
  // Request details
  requestId: string;
  bloodType: string;
  units: number;
  patientName: string;
  medicalCondition: string;
  // Hospital details
  hospital: string;
  hospitalId?: string;
  hospitalDepartment?: string;
  location: string;
  // Status
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  // Timestamps
  acceptedAt: Date | null;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const userDonationsCollection = collection(db, 'user_donations');

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return null;
};

const mapSnapshotToUserDonation = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
): UserDonation => {
  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    donorId: data.donorId ?? '',
    donorName: data.donorName ?? '',
    donorPhone: data.donorPhone ?? '',
    donorBloodType: data.donorBloodType ?? '',
    requestId: data.requestId ?? '',
    bloodType: data.bloodType ?? '',
    units: Number(data.units ?? 1),
    patientName: data.patientName ?? '',
    medicalCondition: data.medicalCondition ?? '',
    hospital: data.hospital ?? '',
    hospitalId: data.hospitalId ?? '',
    hospitalDepartment: data.hospitalDepartment ?? '',
    location: data.location ?? '',
    status: data.status ?? 'pending',
    notes: data.notes ?? '',
    acceptedAt: toDate(data.acceptedAt),
    scheduledAt: toDate(data.scheduledAt),
    completedAt: toDate(data.completedAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

export const createUserDonation = async (donation: {
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodType: string;
  requestId: string;
  bloodType: string;
  units: number;
  patientName: string;
  medicalCondition: string;
  hospital: string;
  hospitalId?: string;
  hospitalDepartment?: string;
  location: string;
  notes?: string;
}): Promise<string> => {
  const docRef = await addDoc(userDonationsCollection, {
    ...donation,
    status: 'pending',
    acceptedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateUserDonationStatus = async (
  donationId: string,
  status: UserDonation['status'],
): Promise<void> => {
  if (!donationId) return;
  
  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };
  
  if (status === 'completed') {
    updateData.completedAt = serverTimestamp();
  }
  
  await updateDoc(doc(userDonationsCollection, donationId), updateData);
};

export const listenToUserDonations = (
  userId: string,
  onUpdate: (donations: UserDonation[]) => void,
  onError?: (error: Error) => void,
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    userDonationsCollection,
    where('donorId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const donations = snapshot.docs.map(mapSnapshotToUserDonation);
      onUpdate(donations);
    },
    (error) => {
      console.error('Error listening to user donations:', error);
      onError?.(error);
    }
  );
};
