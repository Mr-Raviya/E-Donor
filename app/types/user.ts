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
  status?: 'active' | 'inactive';
  joinedDate?: string;
  donationCount?: number;
}

// Added to silence Expo Router route warnings; this file is not a screen.
export default {};
