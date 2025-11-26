import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../types/user';

const COLLECTION = 'profiles';
const profilesCollection = collection(db, COLLECTION);

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
  status: data.status ?? 'active',
  joinedDate: data.joined_date ?? data.created_at ?? undefined,
  donationCount: data.donation_count ?? 0,
});

const serializeProfile = (profile: Partial<UserProfile>): Record<string, any> => {
  const payload: Record<string, any> = {};

  if (profile.name !== undefined) payload.full_name = profile.name;
  if (profile.email !== undefined) payload.email = profile.email;
  if (profile.phone !== undefined) payload.phone = profile.phone;
  if (profile.location !== undefined) payload.location = profile.location;
  if (profile.bloodType !== undefined) payload.blood_type = profile.bloodType;
  if (profile.medicalNotes !== undefined) payload.medical_notes = profile.medicalNotes;
  if (profile.profilePicture !== undefined) payload.profile_picture = profile.profilePicture;
  if (profile.donorLevel !== undefined) payload.donor_level = profile.donorLevel;
  if (profile.lastDonationDate !== undefined) payload.last_donation_date = profile.lastDonationDate;
  if (profile.status !== undefined) payload.status = profile.status;
  if (profile.joinedDate !== undefined) payload.joined_date = profile.joinedDate;
  if (profile.donationCount !== undefined) payload.donation_count = profile.donationCount;

  return payload;
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const snapshot = await getDoc(doc(db, COLLECTION, userId));
  if (!snapshot.exists()) {
    return null;
  }
  return mapSnapshotToProfile(userId, snapshot.data());
};

export const listUserProfiles = async (): Promise<UserProfile[]> => {
  const snapshot = await getDocs(query(profilesCollection));
  return snapshot.docs.map((docSnapshot) => mapSnapshotToProfile(docSnapshot.id, docSnapshot.data()));
};

export const upsertUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>,
): Promise<UserProfile> => {
  console.log('💾 Upserting profile for user:', userId);
  console.log('📋 Profile data:', profile);
  
  const payload = {
    ...serializeProfile(profile),
    updated_at: new Date().toISOString(),
  };
  
  console.log('📦 Serialized payload:', payload);
  
  // Update profiles collection (existing functionality)
  await setDoc(doc(db, COLLECTION, userId), payload, { merge: true });
  console.log('✅ Saved to profiles collection');
  
  // Also create/update in users collection for notifications
  try {
    const userData = {
      email: profile.email || '',
      name: profile.name || '',
      role: 'donor', // Default role for new users
      bloodType: profile.bloodType || 'O+',
      location: profile.location || '',
      phone: profile.phone || '',
      isActive: true,
      createdAt: new Date(),
    };
    
    console.log('📧 Saving to users collection:', userData);
    await setDoc(doc(db, 'users', userId), userData, { merge: true });
    console.log('✅ Saved to users collection');
  } catch (error) {
    console.error('❌ Failed to create user document for notifications:', error);
    // Don't fail the whole operation if users collection update fails
  }
  
  const snapshot = await getDoc(doc(db, COLLECTION, userId));
  const savedProfile = mapSnapshotToProfile(userId, snapshot.data() ?? {});
  console.log('✅ Profile saved successfully:', savedProfile);
  return savedProfile;
};

interface CreateAdminUserInput {
  name: string;
  email: string;
  phone: string;
  bloodType: string;
}

export const createAdminUserProfile = async (
  profile: CreateAdminUserInput & Partial<UserProfile>,
): Promise<UserProfile> => {
  const now = new Date().toISOString();
  const payload = {
    ...serializeProfile({
      ...profile,
      status: profile.status ?? 'active',
      donationCount: profile.donationCount ?? 0,
      joinedDate: profile.joinedDate ?? now,
    }),
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(profilesCollection, payload);
  const snapshot = await getDoc(docRef);
  return mapSnapshotToProfile(docRef.id, snapshot.data() ?? {});
};

export const updateAdminUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile> => {
  const payload = {
    ...serializeProfile(updates),
    updated_at: new Date().toISOString(),
  };
  await updateDoc(doc(db, COLLECTION, userId), payload);
  const snapshot = await getDoc(doc(db, COLLECTION, userId));
  return mapSnapshotToProfile(userId, snapshot.data() ?? {});
};

export const deleteAdminUserProfile = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, userId));
};

// Added to silence Expo Router route warnings; this file is not a screen.
export default {};
