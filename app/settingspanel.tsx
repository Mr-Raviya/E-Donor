import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from './contexts/AppearanceContext';
import { useLocalization } from './contexts/LocalizationContext';
import { useUser } from './contexts/UserContext';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  action?: () => void;
}

export default function SettingsPanel() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocalization();
  const { themeMode, setThemeMode } = useAppearance();
  const { user } = useUser();

  // Notification settings
  const [donationRequests, setDonationRequests] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(false);
  const [notifyPush, setNotifyPush] = useState(true);

  // Accessibility
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [haptics, setHaptics] = useState(true);

  // Privacy
  const [locationSharing, setLocationSharing] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLogoutModalVisible(false);
    router.replace('/sign-in');
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  // Appearance Settings
  const appearanceSettings: SettingItem[] = [
    {
      id: '1',
      title: t('theme'),
      subtitle: `Currently: ${themeMode === 'light' ? 'Light' : 'Dark'}`,
      icon: themeMode === 'dark' ? 'moon' : 'sunny',
      type: 'toggle',
      value: themeMode === 'dark',
      action: () => setThemeMode(themeMode === 'dark' ? 'light' : 'dark'),
    },
    {
      id: '2',
      title: t('language'),
      subtitle: locale === 'en' ? 'English' : locale === 'si' ? 'සිංහල' : 'தமிழ்',
      icon: 'language',
      type: 'action',
      action: () => setLocale(locale === 'en' ? 'si' : locale === 'si' ? 'ta' : 'en'),
    },
  ];

  // Notification Settings
  const notificationSettings: SettingItem[] = [
    {
      id: '1',
      title: t('donationRequests'),
      subtitle: 'Get notified about donation requests',
      icon: 'notifications',
      type: 'toggle',
      value: donationRequests,
      action: () => setDonationRequests(!donationRequests),
    },
    {
      id: '2',
      title: t('urgentAlerts'),
      subtitle: 'Urgent blood donation alerts',
      icon: 'alert-circle',
      type: 'toggle',
      value: urgentAlerts,
      action: () => setUrgentAlerts(!urgentAlerts),
    },
    {
      id: '3',
      title: t('reminders'),
      subtitle: 'Donation reminders',
      icon: 'time',
      type: 'toggle',
      value: reminders,
      action: () => setReminders(!reminders),
    },
    {
      id: '4',
      title: t('email'),
      subtitle: 'Email notifications',
      icon: 'mail',
      type: 'toggle',
      value: notifyEmail,
      action: () => setNotifyEmail(!notifyEmail),
    },
    {
      id: '5',
      title: t('sms'),
      subtitle: 'SMS notifications',
      icon: 'chatbox',
      type: 'toggle',
      value: notifySMS,
      action: () => setNotifySMS(!notifySMS),
    },
    {
      id: '6',
      title: t('push'),
      subtitle: 'Push notifications',
      icon: 'phone-portrait',
      type: 'toggle',
      value: notifyPush,
      action: () => setNotifyPush(!notifyPush),
    },
  ];

  // Accessibility Settings
  const accessibilitySettings: SettingItem[] = [
    {
      id: '1',
      title: t('highContrast'),
      subtitle: 'Increase contrast for better visibility',
      icon: 'contrast',
      type: 'toggle',
      value: highContrast,
      action: () => setHighContrast(!highContrast),
    },
    {
      id: '2',
      title: t('screenReader'),
      subtitle: 'Screen reader support',
      icon: 'book',
      type: 'toggle',
      value: screenReaderEnabled,
      action: () => setScreenReaderEnabled(!screenReaderEnabled),
    },
    {
      id: '3',
      title: t('soundEffects'),
      subtitle: 'Enable sound effects',
      icon: 'volume-high',
      type: 'toggle',
      value: soundEffects,
      action: () => setSoundEffects(!soundEffects),
    },
    {
      id: '4',
      title: t('haptics'),
      subtitle: 'Haptic feedback',
      icon: 'hand-left',
      type: 'toggle',
      value: haptics,
      action: () => setHaptics(!haptics),
    },
  ];

  // Privacy Settings
  const privacySettings: SettingItem[] = [
    {
      id: '1',
      title: t('locationSharing'),
      subtitle: 'Share location with hospitals',
      icon: 'location',
      type: 'toggle',
      value: locationSharing,
      action: () => setLocationSharing(!locationSharing),
    },
    {
      id: '2',
      title: t('profileVisibility'),
      subtitle: 'Make profile visible to others',
      icon: 'eye',
      type: 'toggle',
      value: profileVisible,
      action: () => setProfileVisible(!profileVisible),
    },
    {
      id: '3',
      title: t('changePassword'),
      subtitle: 'Update your password',
      icon: 'lock-closed',
      type: 'action',
      action: () => Alert.alert(t('changePassword'), 'Not implemented yet'),
    },
  ];

  // Support Settings
  const supportSettings: SettingItem[] = [
    {
      id: '1',
      title: t('helpCenter'),
      subtitle: 'Get help and support',
      icon: 'help-circle',
      type: 'action',
      action: () => openLink('https://example.com/help'),
    },
    {
      id: '2',
      title: t('terms'),
      subtitle: 'Terms of Service',
      icon: 'document-text',
      type: 'action',
      action: () => openLink('https://example.com/terms'),
    },
    {
      id: '3',
      title: t('privacyPolicy'),
      subtitle: 'Privacy Policy',
      icon: 'shield-checkmark',
      type: 'action',
      action: () => openLink('https://example.com/privacy'),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { 
        backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff',
        borderBottomColor: themeMode === 'dark' ? '#3a3a3a' : '#f0f0f0'
      }]}
      onPress={item.action}
      activeOpacity={item.type === 'toggle' ? 1 : 0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={22} color="#DC143C" />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{item.title}</Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, { color: themeMode === 'dark' ? '#999' : '#666' }]}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.type === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.action}
          trackColor={{ false: '#e0e0e0', true: '#FFB3B3' }}
          thumbColor={item.value ? '#DC143C' : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={themeMode === 'dark' ? '#999' : '#999'} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeMode === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
      <View style={[styles.header, { 
        backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff',
        borderBottomColor: themeMode === 'dark' ? '#3a3a3a' : '#e0e0e0'
      }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[
            styles.backButton,
            { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={themeMode === 'dark' ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{t('title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <TouchableOpacity 
          style={styles.profileSection}
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#DC143C', '#8B0000']}
            style={styles.profileGradient}
          >
            {user.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.avatarCircle}
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{t('appearance')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {appearanceSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{t('notifications')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {notificationSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* Accessibility Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{t('accessibility')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {accessibilitySettings.map(renderSettingItem)}
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{t('privacy')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {privacySettings.map(renderSettingItem)}
          </View>
        </View>

        {/* Support Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{t('support')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {supportSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>{t('appVersion')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            <View style={[styles.infoItem, { borderBottomColor: themeMode === 'dark' ? '#3a3a3a' : '#f0f0f0' }]}>
              <Text style={[styles.infoLabel, { color: themeMode === 'dark' ? '#999' : '#666' }]}>Version</Text>
              <Text style={[styles.infoValue, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['#DC2626', '#991B1B']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out" size={24} color="#fff" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeMode === 'dark' ? '#999' : '#666' }]}>E-Donor App</Text>
          <Text style={[styles.footerSubtext, { color: themeMode === 'dark' ? '#666' : '#999' }]}>© 2025 All rights reserved</Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#FFFFFF' }]}>
            <Ionicons name="log-out-outline" size={56} color="#DC2626" style={{ marginBottom: 20 }} />
            <Text style={[styles.modalTitle, { color: themeMode === 'dark' ? '#fff' : '#111827' }]}>{t('confirmLogoutTitle')}</Text>
            <Text style={[styles.modalMessage, { color: themeMode === 'dark' ? '#999' : '#6B7280' }]}>{t('confirmLogoutMessage')}</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { 
                  backgroundColor: themeMode === 'dark' ? '#3a3a3a' : '#F3F4F6',
                  borderColor: 'transparent'
                }]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: themeMode === 'dark' ? '#fff' : '#111827' }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={confirmLogout}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>{t('ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingsGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    backgroundColor: 'white',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 15 },
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 0,
    backgroundColor: '#F3F4F6',
  },
  modalPrimaryButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
