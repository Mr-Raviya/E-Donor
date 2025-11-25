export interface HospitalProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  about: string;
  verified: boolean;
  authUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}
