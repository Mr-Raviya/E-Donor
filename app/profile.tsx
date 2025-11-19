import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from './contexts/AppearanceContext';
import { useLocalization } from './contexts/LocalizationContext';
import { useUser } from './contexts/UserContext';

const getBasicInfo = (t: (key: string) => string, user: any) => [
  { icon: 'mail-outline' as const, label: t('emailLabel'), value: user.email },
  { icon: 'call-outline' as const, label: t('phoneLabel'), value: user.phone },
  { icon: 'location-outline' as const, label: t('locationLabel'), value: user.location },
  { icon: 'water-outline' as const, label: t('bloodTypeLabel'), value: user.bloodType },
  { icon: 'calendar-outline' as const, label: t('memberSince'), value: 'January 2023' },
];

const getAdditionalDetails = (t: (key: string) => string, user: any) => [
  { label: t('totalDonations'), value: '12' },
  { label: t('lastDonation'), value: 'July 15, 2024' },
  { label: t('donorStatus'), value: t('goldDonor') },
  { label: t('nextEligible'), value: 'October 20, 2024' },
  { label: t('medicalNotesLabel'), value: user.medicalNotes || 'No restrictions' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { themeMode } = useAppearance();
  const { user } = useUser();
  const isDark = themeMode === 'dark';
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  
  const basicInfo = getBasicInfo(t, user);
  const additionalDetails = getAdditionalDetails(t, user);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      <View style={[styles.header, { 
        backgroundColor: isDark ? '#2a2a2a' : '#fff',
        borderBottomColor: isDark ? '#3a3a3a' : '#e0e0e0'
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a1a' }]}>{t('profile')}</Text>
        <TouchableOpacity onPress={() => router.push('/chat')} style={styles.backButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
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
                <Text style={styles.avatarText}>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
            )}
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileRole}>{t('bloodDonor')}</Text>
          </LinearGradient>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>{t('basicInformation')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            {basicInfo.map((item, index) => (
              <View 
                key={item.label} 
                style={[styles.infoItem, { 
                  backgroundColor: isDark ? '#2a2a2a' : '#fff',
                  borderBottomColor: isDark ? '#3a3a3a' : '#f0f0f0',
                  borderBottomWidth: index < basicInfo.length - 1 ? 1 : 0
                }]}
              >
                <View style={styles.infoLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={22} color="#DC143C" />
                  </View>
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>{item.label}</Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#1a1a1a' }]}>{item.value}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>{t('additionalDetails')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            {additionalDetails.map((detail, index) => (
              <View 
                key={detail.label} 
                style={[styles.detailItem, { 
                  borderBottomColor: isDark ? '#3a3a3a' : '#f0f0f0',
                  borderBottomWidth: index < additionalDetails.length - 1 ? 1 : 0
                }]}
              >
                <Text style={[styles.detailLabel, { color: isDark ? '#999' : '#666' }]}>{detail.label}</Text>
                <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#1a1a1a' }]}>{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>{t('accountActions')}</Text>
          <View style={[styles.settingsGroup, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <TouchableOpacity 
              style={[styles.actionItem, { 
                backgroundColor: isDark ? '#2a2a2a' : '#fff',
                borderBottomColor: isDark ? '#3a3a3a' : '#f0f0f0'
              }]}
              activeOpacity={0.7}
              onPress={() => router.push('/edit-profile')}
            >
              <View style={styles.actionLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="create-outline" size={22} color="#DC143C" />
                </View>
                <Text style={[styles.actionText, { color: isDark ? '#fff' : '#1a1a1a' }]}>{t('editProfile')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#999' : '#999'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setLogoutModalVisible(true);
        }}>
          <LinearGradient
            colors={['#DC2626', '#991B1B']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out" size={24} color="#fff" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#999' : '#666' }]}>{t('edonorProfile')}</Text>
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
          <View style={styles.modalCard}>
            <Ionicons name="log-out-outline" size={48} color="#DC2626" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>{t('confirmLogoutTitle')}</Text>
            <Text style={styles.modalMessage}>{t('confirmLogoutMessage')}</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setLogoutModalVisible(false);
                  router.replace('/sign-in');
                }}
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
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileRole: {
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
  infoItem: {
    padding: 16,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
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
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  modalPrimaryButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});
