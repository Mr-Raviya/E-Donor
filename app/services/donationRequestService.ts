import {
  collection,
  doc,
  DocumentData,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type DonationRequestLocation = {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export type DonationRequest = {
  id: string;
  bloodType: string;
  units: number;
  urgency: 'critical' | 'urgent' | 'normal';
  priorityLevel?: string;
  status?: string;
  patientName?: string;
  patientAge?: number;
  patientStatus?: string;
  medicalCondition?: string;
  notes?: string;
  date?: string;
  hospitalId?: string;
  hospital?: string;
  hospitalDepartment?: string;
  hospitalDistance?: string;
  hospitalEmail?: string;
  hospitalPhone?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  hospitalLocationText?: string;
  hospitalLocation?: DonationRequestLocation;
  source?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

const donationRequestsCollection = collection(db, 'donation_requests');

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return null;
};

const mapSnapshotToDonationRequest = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
): DonationRequest => {
  const data = snapshot.data() ?? {};
  const location = data.hospitalLocation ?? {};

  return {
    id: snapshot.id,
    bloodType: data.bloodType ?? '',
    units: Number(data.units ?? 0),
    urgency: (data.urgency ?? data.priorityLevel ?? 'normal') as DonationRequest['urgency'],
    priorityLevel: data.priorityLevel ?? data.urgency ?? 'normal',
    status: data.status ?? 'pending',
    patientName: data.patientName ?? '',
    patientAge: typeof data.patientAge === 'number' ? data.patientAge : Number(data.patientAge ?? 0),
    patientStatus: data.patientStatus ?? '',
    medicalCondition: data.medicalCondition ?? '',
    notes: data.notes ?? '',
    date: data.date ?? '',
    hospitalId: data.hospitalId ?? data.hospital_id ?? '',
    hospital: data.hospital ?? data.hospitalName ?? '',
    hospitalDepartment: data.hospitalDepartment ?? '',
    hospitalDistance: typeof data.hospitalDistance === 'number'
      ? String(data.hospitalDistance)
      : data.hospitalDistance ?? '',
    hospitalEmail: data.hospitalEmail ?? '',
    hospitalPhone: data.hospitalPhone ?? '',
    contactPerson: data.contactPerson ?? '',
    contactPhone: data.contactPhone ?? data.hospitalPhone ?? '',
    contactEmail: data.contactEmail ?? data.hospitalEmail ?? '',
    hospitalLocationText: data.hospitalLocationText ?? '',
    hospitalLocation: {
      street: location.street ?? '',
      city: location.city ?? '',
      state: location.state ?? '',
      zipCode: location.zipCode ?? location.zip_code ?? '',
    },
    source: data.source ?? '',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

export const listenToDonationRequests = (
  onUpdate: (requests: DonationRequest[]) => void,
  onError?: (error: Error) => void,
) => {
  const q = query(donationRequestsCollection, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map(mapSnapshotToDonationRequest);
      onUpdate(requests);
    },
    (error) => {
      console.error('Failed to listen to donation requests', error);
      onError?.(error);
    },
  );
};

export const fetchDonationRequestById = async (id: string): Promise<DonationRequest | null> => {
  if (!id) return null;
  const snapshot = await getDoc(doc(donationRequestsCollection, id));
  if (!snapshot.exists()) return null;
  return mapSnapshotToDonationRequest(snapshot as QueryDocumentSnapshot<DocumentData>);
};

// Added to silence Expo Router route warnings; this file is not a screen.
export default {};
