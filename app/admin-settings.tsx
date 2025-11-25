import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdmin } from './contexts/AdminContext';
import { useAppearance } from './contexts/AppearanceContext';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  action?: () => void;
}

export default function AdminSettings() {
  const router = useRouter();
  const { admin, logout } = useAdmin();
  const { themeMode, setThemeMode } = useAppearance();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    lowStockAlerts: true,
    maintenanceMode: false,
  });

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLogoutModalVisible(false);
    await logout();
    router.replace('/sign-in');
  };

  const appearanceSettings: SettingItem[] = [
    {
      id: '0',
      title: 'Dark Mode',
      subtitle: 'Switch between light and dark theme',
      icon: themeMode === 'dark' ? 'moon' : 'sunny',
      type: 'toggle',
      value: themeMode === 'dark',
      action: () => setThemeMode(themeMode === 'dark' ? 'light' : 'dark'),
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      id: '1',
      title: 'Email Notifications',
      subtitle: 'Receive updates via email',
      icon: 'mail',
      type: 'toggle',
      value: settings.emailNotifications,
      action: () => handleToggle('emailNotifications'),
    },
    {
      id: '2',
      title: 'Push Notifications',
      subtitle: 'Enable push notifications',
      icon: 'notifications',
      type: 'toggle',
      value: settings.pushNotifications,
      action: () => handleToggle('pushNotifications'),
    },
    {
      id: '3',
      title: 'Low Stock Alerts',
      subtitle: 'Alert when inventory is low',
      icon: 'alert-circle',
      type: 'toggle',
      value: settings.lowStockAlerts,
      action: () => handleToggle('lowStockAlerts'),
    },
  ];

  const systemSettings: SettingItem[] = [
    {
      id: '1',
      title: 'Maintenance Mode',
      subtitle: 'Restrict app access for maintenance',
      icon: 'construct',
      type: 'toggle',
      value: settings.maintenanceMode,
      action: () => handleToggle('maintenanceMode'),
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
          <Ionicons name={item.icon} size={24} color="#DC143C" />
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeMode === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}
      edges={['top']}
    >
      <View style={[styles.header, { 
        backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff',
        borderBottomColor: themeMode === 'dark' ? '#3a3a3a' : '#e0e0e0'
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeMode === 'dark' ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={['#DC143C', '#8B0000']}
            style={styles.profileGradient}
          >
            <View style={styles.avatarCircle}>
              <Ionicons name="shield-checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
            <Text style={styles.adminEmail}>{admin?.email}</Text>
          </LinearGradient>
        </View>

        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>Appearance</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {appearanceSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>Notifications</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {notificationSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* System Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>System</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            {systemSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>About</Text>
          <View style={[styles.settingsGroup, { backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#fff' }]}>
            <View style={[styles.infoItem, { borderBottomColor: themeMode === 'dark' ? '#3a3a3a' : '#f0f0f0' }]}>
              <Text style={[styles.infoLabel, { color: themeMode === 'dark' ? '#999' : '#666' }]}>Version</Text>
              <Text style={[styles.infoValue, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>1.0.0</Text>
            </View>
            <View style={[styles.infoItem, { borderBottomColor: themeMode === 'dark' ? '#3a3a3a' : '#f0f0f0' }]}>
              <Text style={[styles.infoLabel, { color: themeMode === 'dark' ? '#999' : '#666' }]}>Build</Text>
              <Text style={[styles.infoValue, { color: themeMode === 'dark' ? '#fff' : '#1a1a1a' }]}>2025.11.06</Text>
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
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeMode === 'dark' ? '#999' : '#666' }]}>E-Donor Admin Panel</Text>
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
            <Text style={[styles.modalTitle, { color: themeMode === 'dark' ? '#fff' : '#111827' }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: themeMode === 'dark' ? '#999' : '#6B7280' }]}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { 
                  backgroundColor: themeMode === 'dark' ? '#3a3a3a' : '#F3F4F6',
                  borderColor: 'transparent'
                }]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: themeMode === 'dark' ? '#fff' : '#111827' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={confirmLogout}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>Logout</Text>
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
    padding: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 32,
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
  adminName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  adminEmail: {
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
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
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
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
