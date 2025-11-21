export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bloodType: string;
  medicalNotes: string;
  profilePicture?: string;
  donorLevel?: string;
  lastDonationDate?: string;
}
