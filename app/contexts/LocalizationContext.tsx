import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'si' | 'ta';

type LocalizationContextShape = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const LocalizationContext = createContext<LocalizationContextShape | undefined>(undefined);

const LOCALE_STORAGE_KEY = '@e_donor_locale';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // settings
    title: 'Settings',
    notifications: 'Notification Settings',
    donationRequests: 'Blood Donation Requests',
    urgentAlerts: 'Urgent Alerts',
    reminders: 'Donation Reminders',
    channels: 'Channels',
    email: 'Email Notifications',
    sms: 'SMS Notifications',
    push: 'Push Notifications',
    appearance: 'Appearance & Display',
    language: 'Language',
    theme: 'Theme',
    fontSize: 'Font Size',
    accessibility: 'Accessibility',
    highContrast: 'High Contrast',
    screenReader: 'Screen Reader',
    soundEffects: 'Sound Effects',
    haptics: 'Haptic Feedback',
    privacy: 'Privacy',
    locationSharing: 'Location Sharing',
    profileVisibility: 'Profile Visibility',
    changePassword: 'Change Password',
    support: 'Support',
    helpCenter: 'Help Center',
    terms: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    appVersion: 'App Version',
    logout: 'Logout',
    confirmLogoutTitle: 'Confirm logout',
    confirmLogoutMessage: 'Are you sure you want to logout?',
    cancel: 'Cancel',
    ok: 'OK',
    // home/profile
    profile: 'Profile',
    basicInformation: 'Basic Information',
    additionalDetails: 'Additional Details',
    accountActions: 'Account Actions',
    editProfile: 'Edit Profile',
    bloodDonor: 'Blood Donor',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    locationLabel: 'Location',
    bloodTypeLabel: 'Blood Type',
    memberSince: 'Member Since',
    totalDonations: 'Total Donations',
    livesSaved: 'Lives Saved',
    donorStatus: 'Donor Status',
    nearbyRequests: 'Nearby Blood Requests',
    requestsSubtitle: 'Requests close to your current location',
    activeBadge: 'Active',
    donationHistory: 'Donation History',
    respond: 'Respond',
    goldDonor: 'Gold Donor',
  // profile screen
  lastDonation: 'Last Donation',
  nextEligible: 'Next Eligible',
  medicalNotesLabel: 'Medical Notes',
  edonorProfile: 'E-Donor Profile',
  // chat screen
  messages: 'Messages',
  typeMessage: 'Type a message...',
  // home screen
  welcomeBack: 'Welcome Back',
  findRequests: 'Find Requests',
  myDonations: 'My Donations',
  urgentBloodRequests: 'Urgent Blood Requests',
  helpSaveLives: 'Help save lives nearby',
  clearAllNotifications: 'Clear All Notifications',
  allCaughtUp: 'All caught up!',
  noUnreadNotifications: 'You have no unread notifications',
  noNotificationsAtMoment: 'You have no notifications at the moment',
  // notifications
  notificationsScreen: 'Notifications',
  markAllRead: 'Mark All as Read',
  clearAll: 'Clear All',
  allowNotifications: 'Allow Notifications',
  allowNotificationsHint: 'Receive app updates and important alerts',
  recentNotifications: 'Recent',
  noNotifications: 'No notifications',
  all: 'All',
  unread: 'Unread',
  // edit profile
  editProfileTitle: 'Edit Profile',
  basicInfo: 'Basic Information',
  medicalInfo: 'Medical Information',
  fullName: 'Full Name',
  emailAddress: 'Email Address',
  phoneNumber: 'Phone Number',
  location: 'Location',
  bloodType: 'Blood Type',
  medicalNotes: 'Medical Notes',
  changePhoto: 'Change Photo',
  saveChanges: 'Save Changes',
  saving: 'Saving...',
  required: 'required',
  enterFullName: 'Enter your full name',
  enterEmail: 'Enter your email',
  enterPhone: 'Enter your phone number',
  enterLocation: 'Enter your location',
  enterMedicalNotes: 'Enter any medical notes or restrictions',
  validationError: 'Validation Error',
  nameRequired: 'Name is required',
  emailRequired: 'Email is required',
  emailInvalid: 'Please enter a valid email address',
  phoneRequired: 'Phone number is required',
  bloodTypeRequired: 'Please select your blood type',
  success: 'Success',
  profileUpdated: 'Your profile has been updated successfully!',
  discardChanges: 'Discard Changes?',
  discardMessage: 'Are you sure you want to discard your changes?',
  discard: 'Discard',
  },
  si: {
    title: 'සැකසුම්',
    notifications: 'නිවේදන සැකසුම්',
    donationRequests: 'රූපවාහිනී අයදුම්',
    urgentAlerts: 'ඉක්මන් අනතුරු ඇඟවීම්',
    reminders: 'තහවුරු කිරීම්',
    channels: 'චැනල්',
    email: 'ඊමේල් දැනුම්දීම්',
    sms: 'SMS දැනුම්දීම්',
    push: 'පූෂ් දැනුම්දීම්',
    appearance: 'පෙනුම සහ ප්‍රදර්ශනය',
    language: 'භාෂාව',
    theme: 'තේමාව',
    fontSize: 'අකුරු ප්රමාණය',
    accessibility: 'ප්‍රවේශය',
    highContrast: 'උපරිම විරසාව',
    screenReader: 'තිරය කියවනය',
    soundEffects: 'ශබ්ද බලපෑම්',
    haptics: 'හැප්ටික් ප්රතිචාර',
    privacy: 'පෞද්ගලිකභාවය',
    locationSharing: 'ස්ථාන බෙදාගැනීම',
    profileVisibility: 'පැතිකඩ දෘශ්‍යතාව',
    changePassword: 'මුරපදය වෙනස් කරන්න',
    support: 'ආධාර',
    helpCenter: 'උදව් මධ්‍යස්ථානය',
    terms: 'නියම සහ කොන්දේසි',
    privacyPolicy: 'ගෝපනීය ප්රතිපත්තිය',
    appVersion: 'යෙදුම් අනුවාදය',
    logout: 'ඉවත් වීම',
    confirmLogoutTitle: 'ඉවත් වීම තහවුරු කරන්න',
    confirmLogoutMessage: 'ඔබට ඉවත් වීමට ඇත්තේද?',
    cancel: 'අවලංගු කරන්න',
    ok: 'හරි',
    profile: 'ප්‍රොෆයිලය',
    basicInformation: 'මූලික තොරතුරු',
    additionalDetails: 'අතිකත තොරතුරු',
    accountActions: 'ගිණුම් ක්‍රියාකාරකම්',
    editProfile: 'ප්‍රොෆයිලය සංස්කරණය',
    bloodDonor: 'ලේ දායක',
    emailLabel: 'ඊමේල්',
    phoneLabel: 'ෆෝන්',
    locationLabel: 'ස්ථානය',
    bloodTypeLabel: 'රුධිර වර්ගය',
    memberSince: 'සහභාගී වී ඇති දිනය',
    totalDonations: 'මුළු දාන',
    livesSaved: 'ජීවිත බේරාගත්',
    donorStatus: 'දායක තත්වය',
    nearbyRequests: 'සමීප ලේ ඉල්ලීම්',
    requestsSubtitle: 'ඔබේ පවතින ස්ථානයට සමීප ඉල්ලීම්',
    activeBadge: 'සක්‍රීය',
    donationHistory: 'දායක හුදකලා',
    respond: 'පිළිතුරු දක්වන්න',
    goldDonor: 'රන් දායක',
  // profile screen
  lastDonation: 'අවසාන දායකත්වය',
  nextEligible: 'මීළඟ සුදුසුකම',
  medicalNotesLabel: 'වෛද්‍ය සටහන්',
  edonorProfile: 'ඊ-දායක ප්‍රොෆයිලය',
  // chat screen
  messages: 'පණිවිඩ',
  typeMessage: 'පණිවිඩයක් ටයිප් කරන්න...',
  // home screen
  welcomeBack: 'නැවත පිළිගනිමු',
  findRequests: 'ඉල්ලීම් සොයන්න',
  myDonations: 'මගේ දායකත්ව',
  urgentBloodRequests: 'හදිසි රුධිර ඉල්ලීම්',
  helpSaveLives: 'ආසන්නයේ ජීවිත බේරා ගැනීමට උදව් කරන්න',
  clearAllNotifications: 'සියලු නිවේදන ඉවත් කරන්න',
  allCaughtUp: 'සියල්ල සම්පූර්ණයි!',
  noUnreadNotifications: 'ඔබට නොකියවූ නිවේදන නැත',
  noNotificationsAtMoment: 'මේ මොහොතේ ඔබට නිවේදන නොමැත',
  // notifications
  notificationsScreen: 'නිවේදන',
  markAllRead: 'සියල්ල කියවළා යවන්න',
  clearAll: 'සියල්ල මකන්න',
  allowNotifications: 'නිවේදන තහවුරු කරන්න',
  allowNotificationsHint: 'යෙදුම් යාවත්කාලීන සහ සැලකිලිමත් අනතුරු ඇඟවීම් ලබා ගන්න',
  recentNotifications: 'हाल',
  noNotifications: 'නොමැත නිවේදන',
  all: 'සියල්ල',
  unread: 'පෑදිය නොතැන්',
  // edit profile
  editProfileTitle: 'පැතිකඩ සංස්කරණය කරන්න',
  basicInfo: 'මූලික තොරතුරු',
  medicalInfo: 'වෛද්‍ය තොරතුරු',
  fullName: 'සම්පූර්ණ නම',
  emailAddress: 'විද්‍යුත් තැපැල් ලිපිනය',
  phoneNumber: 'දුරකථන අංකය',
  location: 'ස්ථානය',
  bloodType: 'රුධිර වර්ගය',
  medicalNotes: 'වෛද්‍ය සටහන්',
  changePhoto: 'ඡායාරූපය වෙනස් කරන්න',
  saveChanges: 'වෙනස්කම් සුරකින්න',
  saving: 'සුරකිමින්...',
  required: 'අවශ්‍ය',
  enterFullName: 'ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න',
  enterEmail: 'ඔබේ ඊමේල් ඇතුළත් කරන්න',
  enterPhone: 'ඔබේ දුරකථන අංකය ඇතුළත් කරන්න',
  enterLocation: 'ඔබේ ස්ථානය ඇතුළත් කරන්න',
  enterMedicalNotes: 'ඕනෑම වෛද්‍ය සටහන් හෝ සීමාවන් ඇතුළත් කරන්න',
  validationError: 'වලංගු කිරීමේ දෝෂයකි',
  nameRequired: 'නම අවශ්‍ය වේ',
  emailRequired: 'ඊමේල් අවශ්‍ය වේ',
  emailInvalid: 'කරුණාකර වලංගු ඊමේල් ලිපිනයක් ඇතුළත් කරන්න',
  phoneRequired: 'දුරකථන අංකය අවශ්‍ය වේ',
  bloodTypeRequired: 'කරුණාකර ඔබේ රුධිර වර්ගය තෝරන්න',
  success: 'සාර්ථකයි',
  profileUpdated: 'ඔබේ පැතිකඩ සාර්ථකව යාවත්කාලීන කරන ලදී!',
  discardChanges: 'වෙනස්කම් ඉවත දමන්නද?',
  discardMessage: 'ඔබට ඔබේ වෙනස්කම් ඉවත දැමීමට අවශ්‍යද?',
  discard: 'ඉවත දමන්න',
  },
  ta: {
    title: 'அமைப்புகள்',
    notifications: 'அறிவிப்புகள்',
    donationRequests: 'இரத்த தான கோரிக்கைகள்',
    urgentAlerts: 'அவசர எச்சரிக்கைகள்',
    reminders: 'எச்சரிப்புகள்',
    channels: 'சேனல்கள்',
    email: 'மின்னஞ்சல் அறிவிப்புகள்',
    sms: 'SMS அறிவிப்புகள்',
    push: 'புஷ் அறிவிப்புகள்',
    appearance: 'தோற்றம் மற்றும் காட்சி',
    language: 'மொழி',
    theme: 'தீம்',
    fontSize: 'எழுத்து அளவு',
    accessibility: 'அணுகல்',
    highContrast: 'உயர் எதிரொலி',
    screenReader: 'திரை வாசகர்',
    soundEffects: 'இசை விளைவுகள்',
    haptics: 'ஹாப்டிக் பின்னூட்டம்',
    privacy: 'தனியுரிமை',
    locationSharing: 'இடம் பகிர்தல்',
    profileVisibility: 'சுயவிவர காட்சி',
    changePassword: 'கடவுச்சொல்லை மாற்று',
    support: 'ஆதரவு',
    helpCenter: 'உதவி மையம்',
    terms: 'விதிமுறைகள்',
    privacyPolicy: 'தனியுரிமை கொள்கை',
    appVersion: 'ஆப் உலகம்',
    logout: 'வெளியேறு',
    confirmLogoutTitle: 'வெளியேறுவதை உறுதிப்படுத்தவும்',
    confirmLogoutMessage: 'வெளியேற்றுவதை உறுதிப்படுத்தவையாக இருக்கிறீர்களா?',
    cancel: 'ரத்து',
    ok: 'சரி',
    profile: 'சுயவிவரம்',
    basicInformation: 'அடிப்படை தகவல்',
    additionalDetails: 'மேலும் விவரங்கள்',
    accountActions: 'கணக்கு செயல்கள்',
    editProfile: 'சுயவிவரம் தொகுக்க',
    bloodDonor: 'இரத்த தானம்',
    emailLabel: 'மின்னஞ்சல்',
    phoneLabel: 'தொலைபேசி',
    locationLabel: 'இடம்',
    bloodTypeLabel: 'இரத்த வகை',
    memberSince: 'உறுப்பினர் இருந்து',
    totalDonations: 'மொத்த தானங்கள்',
    livesSaved: 'உலகுகள் காப்பது',
    donorStatus: 'தானகர் நிலை',
    nearbyRequests: 'அனுகிராம இரத்த கோரிக்கைகள்',
    requestsSubtitle: 'உங்கள் தற்போதைய இடத்திற்கு அருகிலுள்ள கோரிக்கைகள்',
    activeBadge: 'செயல்பாட்டுள்ள',
    donationHistory: 'தான வரலாறு',
    respond: 'பதில் சொல்லவும்',
    goldDonor: 'தங்க தானர்',
  // profile screen
  lastDonation: 'கடைசி தானம்',
  nextEligible: 'அடுத்த தகுதி',
  medicalNotesLabel: 'மருத்துவ குறிப்புகள்',
  edonorProfile: 'ஈ-தானவர் சுயவிவரம்',
  // chat screen
  messages: 'செய்திகள்',
  typeMessage: 'ஒரு செய்தியை தட்டச்சு செய்யவும்...',
  // home screen
  welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
  findRequests: 'கோரிக்கைகளைக் கண்டறியவும்',
  myDonations: 'எனது தானங்கள்',
  urgentBloodRequests: 'அவசர இரத்த கோரிக்கைகள்',
  helpSaveLives: 'அருகில் உள்ள உயிர்களைக் காப்பாற்ற உதவுங்கள்',
  clearAllNotifications: 'அனைத்து அறிவிப்புகளையும் அழிக்கவும்',
  allCaughtUp: 'அனைத்தும் முடிந்தது!',
  noUnreadNotifications: 'உங்களிடம் படிக்காத அறிவிப்புகள் இல்லை',
  noNotificationsAtMoment: 'தற்போது உங்களிடம் அறிவிப்புகள் இல்லை',
  // notifications
  notificationsScreen: 'அறிவிப்புகள்',
  markAllRead: 'அனைத்தையும் வாசித்ததாக குறிப்பிடு',
  clearAll: 'அனைத்தையும் அழி',
  allowNotifications: 'அறிவிப்புகளை அனுமதிக்கவும்',
  allowNotificationsHint: 'பயன்பாட்டின் 업데이트 மற்றும் முக்கிய எச்சரிக்கைகள் பெறுங்கள்',
  recentNotifications: 'சமீபத்தியவை',
  noNotifications: 'எந்த அறிவிப்புகளும் இல்லை',
  all: 'அனைத்து',
  unread: 'வாசிக்கப்படாதவை',
  // edit profile
  editProfileTitle: 'சுயவிவரத்தைத் தொகு',
  basicInfo: 'அடிப்படை தகவல்',
  medicalInfo: 'மருத்துவ தகவல்',
  fullName: 'முழு பெயர்',
  emailAddress: 'மின்னஞ்சல் முகவரி',
  phoneNumber: 'தொலைபேசி எண்',
  location: 'இடம்',
  bloodType: 'இரத்த வகை',
  medicalNotes: 'மருத்துவ குறிப்புகள்',
  changePhoto: 'புகைப்படம் மாற்று',
  saveChanges: 'மாற்றங்களை சேமிக்கவும்',
  saving: 'சேமிக்கிறது...',
  required: 'தேவை',
  enterFullName: 'உங்கள் முழு பெயரை உள்ளிடவும்',
  enterEmail: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
  enterPhone: 'உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்',
  enterLocation: 'உங்கள் இடத்தை உள்ளிடவும்',
  enterMedicalNotes: 'ஏதேனும் மருத்துவ குறிப்புகள் அல்லது கட்டுப்பாடுகளை உள்ளிடவும்',
  validationError: 'சரிபார்ப்பு பிழை',
  nameRequired: 'பெயர் தேவை',
  emailRequired: 'மின்னஞ்சல் தேவை',
  emailInvalid: 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்',
  phoneRequired: 'தொலைபேசி எண் தேவை',
  bloodTypeRequired: 'உங்கள் இரத்த வகையை தேர்ந்தெடுக்கவும்',
  success: 'வெற்றி',
  profileUpdated: 'உங்கள் சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!',
  discardChanges: 'மாற்றங்களை நிராகரிக்கவா?',
  discardMessage: 'உங்கள் மாற்றங்களை நிராகரிக்க விரும்புகிறீர்களா?',
  discard: 'நிராகரி',
  },
};

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load saved locale on mount
  useEffect(() => {
    const loadLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (savedLocale && (savedLocale === 'en' || savedLocale === 'si' || savedLocale === 'ta')) {
          setLocaleState(savedLocale as Locale);
        }
      } catch (error) {
        console.error('Failed to load locale:', error);
      }
    };
    loadLocale();
  }, []);

  // Save locale whenever it changes
  const setLocale = useCallback(async (newLocale: Locale) => {
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      setLocaleState(newLocale);
    } catch (error) {
      console.error('Failed to save locale:', error);
      setLocaleState(newLocale); // Still update the state even if save fails
    }
  }, []);

  const t = useCallback((key: string) => translations[locale][key] ?? key, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization must be used within LocalizationProvider');
  return ctx;
}

// Added to silence Expo Router route warnings; this file is not a screen.
export default function IgnoreLocalizationRoute() {
  return null;
}
