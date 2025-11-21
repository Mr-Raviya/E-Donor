import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../types/user';

const COLLECTION = 'profiles';

const mapSnapshotToProfile = (userId: string, data: Record<string, any>): UserProfile => ({
  id: userId,
  name: data.full_name ?? '',
  email: data.email ?? '',
  phone: data.phone ?? '',
  location: data.location ?? '',
  bloodType: data.blood_type ?? '',
  medicalNotes: data.medical_notes ?? '',
  profilePicture: data.profile_picture ?? undefined,
  donorLevel: data.donor_level ?? undefined,
  lastDonationDate: data.last_donation_date ?? undefined,
});

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const snapshot = await getDoc(doc(db, COLLECTION, userId));
  if (!snapshot.exists()) {
    return null;
  }
  return mapSnapshotToProfile(userId, snapshot.data());
};

export const upsertUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>,
): Promise<UserProfile> => {
  const payload = {
    full_name: profile.name ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    location: profile.location ?? null,
    blood_type: profile.bloodType ?? null,
    medical_notes: profile.medicalNotes ?? null,
    profile_picture: profile.profilePicture ?? null,
    donor_level: profile.donorLevel ?? null,
    last_donation_date: profile.lastDonationDate ?? null,
    updated_at: new Date().toISOString(),
  };

  await setDoc(doc(db, COLLECTION, userId), payload, { merge: true });
  const snapshot = await getDoc(doc(db, COLLECTION, userId));
  return mapSnapshotToProfile(userId, snapshot.data() ?? {});
};
