import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import Constants from 'expo-constants';
import { db } from '../../lib/firebase';
import { HospitalProfile } from '../types/hospital';
import { auth } from '../../lib/firebase';

const COLLECTION = 'hospitals';
const hospitalsCollection = collection(db, COLLECTION);
const mailCollection = collection(db, 'mail');
const usersCollection = collection(db, 'users');

const mapSnapshotToHospital = (id: string, data: Record<string, any>): HospitalProfile => ({
  id,
  name: data.name ?? '',
  email: data.email ?? '',
  phone: data.phone ?? '',
  street: data.street ?? '',
  city: data.city ?? '',
  state: data.state ?? '',
  zipCode: data.zipCode ?? '',
  about: data.about ?? '',
  verified: data.verified ?? false,
  authUserId: data.authUserId ?? data.auth_user_id ?? undefined,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const listHospitals = async (): Promise<HospitalProfile[]> => {
  const snapshot = await getDocs(query(hospitalsCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnapshot) =>
    mapSnapshotToHospital(docSnapshot.id, docSnapshot.data() ?? {}),
  );
};

export const createHospitalProfile = async (
  hospital: Omit<HospitalProfile, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<HospitalProfile> => {
  const now = new Date().toISOString();
  const payload = {
    ...hospital,
    auth_user_id: hospital.authUserId ?? null,
    createdBy: auth.currentUser?.uid ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(hospitalsCollection, payload);
  const snapshot = await getDoc(docRef);
  return mapSnapshotToHospital(docRef.id, snapshot.data() ?? payload);
};

export const updateHospitalProfile = async (
  id: string,
  updates: Partial<HospitalProfile>,
): Promise<HospitalProfile> => {
  const payload = {
    ...updates,
    updatedBy: auth.currentUser?.uid ?? null,
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(doc(db, COLLECTION, id), payload);
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  return mapSnapshotToHospital(id, snapshot.data() ?? {});
};

export const deleteHospitalProfile = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION, id));
};

export const createHospitalAuthAccount = async ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<string> => {
  const apiKey =
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
    (Constants.expoConfig as any)?.extra?.firebase?.apiKey ??
    (Constants.manifest as any)?.extra?.firebase?.apiKey;

  if (!apiKey) {
    throw new Error('Firebase API key is missing. Set EXPO_PUBLIC_FIREBASE_API_KEY.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    const message =
      errorData?.error?.message ?? 'Failed to create hospital auth account. Please try again.';
    throw new Error(message);
  }

  const data = await response.json();
  const uid = data.localId as string;

  // Create/update users collection entry for role tracking
  try {
    await setDoc(
      doc(usersCollection, uid),
      {
        email,
        name,
        role: 'hospital',
        hospitalId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid ?? null,
      },
      { merge: true },
    );
  } catch (userDocError) {
    console.error('Failed to create hospital user record', userDocError);
  }

  return uid;
};

export const linkHospitalUserRecord = async ({
  authUserId,
  hospitalId,
  hospitalName,
}: {
  authUserId: string;
  hospitalId: string;
  hospitalName: string;
}) => {
  try {
    await setDoc(
      doc(usersCollection, authUserId),
      {
        hospitalId,
        hospitalName,
        role: 'hospital',
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Failed to link hospital user record', error);
  }
};

export const sendHospitalCredentialsEmail = async ({
  hospitalName,
  email,
  password,
}: {
  hospitalName: string;
  email: string;
  password: string;
}) => {
  // This writes to the `mail` collection, which can be wired to Firebase's email extension
  // so credentials are delivered automatically.
  const subject = `Your E-Donor hospital access`;
  const textBody = [
    `Hello ${hospitalName || 'Hospital Team'},`,
    '',
    'Your hospital profile has been created on E-Donor.',
    `Login email: ${email}`,
    `Temporary password: ${password}`,
    '',
    'Please sign in and change this password after your first login.',
    '',
    'Thank you,',
    'E-Donor Admin Team',
  ].join('\n');

  const htmlBody = textBody
    .split('\n')
    .map((line) => `<p style="margin:0 0 12px 0">${line || '&nbsp;'}</p>`)
    .join('');

  await addDoc(mailCollection, {
    to: [email],
    message: {
      subject,
      text: textBody,
      html: htmlBody,
    },
    createdAt: new Date().toISOString(),
  });
};
