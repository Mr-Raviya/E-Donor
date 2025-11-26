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

const getBasicInfo = (t: (key: string) => string, user: any, memberSince: string) => [
  { icon: 'mail-outline' as const, label: t('emailLabel'), value: user.email },
  { icon: 'call-outline' as const, label: t('phoneLabel'), value: user.phone },
  { icon: 'location-outline' as const, label: t('locationLabel'), value: user.location },
  { icon: 'water-outline' as const, label: t('bloodTypeLabel'), value: user.bloodType },
  { icon: 'calendar-outline' as const, label: t('memberSince'), value: memberSince },
];

type DonorLevel = 'Bronze' | 'Silver' | 'Gold';

const DONOR_LEVEL_COLORS: Record<DonorLevel, { bg: string; bgDark: string; text: string; textDark: string }> = {
  Bronze: { bg: '#FED7AA', bgDark: '#7C2D12', text: '#C2410C', textDark: '#FDBA74' },
  Silver: { bg: '#E5E7EB', bgDark: '#374151', text: '#374151', textDark: '#D1D5DB' },
  Gold: { bg: '#FEF3C7', bgDark: '#78350F', text: '#B45309', textDark: '#FDE68A' },
};

const getDonorLevel = (level: string | undefined): DonorLevel => {
  if (level === 'Gold' || level === 'Silver' || level === 'Bronze') {
    return level;
  }
  return 'Bronze';
};

const getDonorLevelLabel = (level: string | undefined): string => {
  switch (level) {
    case 'Gold':
      return 'Gold Donor';
    case 'Silver':
      return 'Silver Donor';
    case 'Bronze':
      return 'Bronze Donor';
    default:
      return 'Bronze Donor';
  }
};

const formatLastDonationDate = (dateString: string | undefined): string => {
  if (!dateString) return 'No donations yet';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

const calculateNextEligible = (lastDonation: string | undefined): string => {
  if (!lastDonation) return 'Eligible now';
  try {
    const lastDate = new Date(lastDonation);
    // 56 days (8 weeks) minimum between donations
    const nextDate = new Date(lastDate.getTime() + 56 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (nextDate <= now) return 'Eligible now';
    
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(nextDate);
  } catch {
    return 'Eligible now';
  }
};

const getAdditionalDetails = (t: (key: string) => string, user: any) => [
  { label: t('totalDonations'), value: String(user.donationCount ?? 0) },
  { label: t('lastDonation'), value: formatLastDonationDate(user.lastDonationDate) },
  { label: t('donorStatus'), value: getDonorLevelLabel(user.donorLevel) },
  { label: t('nextEligible'), value: calculateNextEligible(user.lastDonationDate) },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { themeMode } = useAppearance();
  const { user, session } = useUser();
  const isDark = themeMode === 'dark';
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const [donorStatusModalVisible, setDonorStatusModalVisible] = React.useState(false);

  const memberSince = React.useMemo(() => {
    const creation = session?.metadata?.creationTime;
    if (!creation) {
      return 'N/A';
    }
    const date = new Date(creation);
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }, [session?.metadata?.creationTime]);
  
  const basicInfo = getBasicInfo(t, user, memberSince);
  const additionalDetails = getAdditionalDetails(t, user);
  
  // Get donor level colors
  const donorLevel = getDonorLevel(user.donorLevel);
  const levelColors = DONOR_LEVEL_COLORS[donorLevel];
  
  // Calculate donor progress
  const donationCount = user.donationCount ?? 0;
  const getDonorProgress = () => {
    // Bronze: 0-4 donations (0-33% bar), Silver: 5-14 donations (33-66% bar), Gold: 15+ donations (66-100% bar)
    if (donorLevel === 'Gold') {
      // Gold: 100% filled
      return { progress: 100, barWidth: 100, nextLevel: null, donationsToNext: 0, currentMin: 15, nextMin: 15 };
    } else if (donorLevel === 'Silver') {
      // Silver: bar fills from 33% to 66% (progress within silver tier)
      const silverProgress = ((donationCount - 5) / 10) * 33; // 0-33% of silver segment
      const barWidth = 33 + silverProgress; // 33% (bronze complete) + silver progress
      return { progress: silverProgress, barWidth, nextLevel: 'Gold', donationsToNext: 15 - donationCount, currentMin: 5, nextMin: 15 };
    } else {
      // Bronze: bar fills from 0% to 33%
      const bronzeProgress = (donationCount / 5) * 33; // 0-33% of bronze segment
      return { progress: bronzeProgress, barWidth: bronzeProgress, nextLevel: 'Silver', donationsToNext: 5 - donationCount, currentMin: 0, nextMin: 5 };
    }
  };
  const donorProgress = getDonorProgress();

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
                {detail.label === t('donorStatus') ? (
                  <TouchableOpacity 
                    style={[styles.donorLevelBadge, { 
                      backgroundColor: isDark ? levelColors.bgDark : levelColors.bg 
                    }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDonorStatusModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="medal-outline" size={14} color={isDark ? levelColors.textDark : levelColors.text} />
                    <Text style={[styles.donorLevelText, { color: isDark ? levelColors.textDark : levelColors.text }]}>
                      {getDonorLevelLabel(donorLevel)}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={isDark ? levelColors.textDark : levelColors.text} />
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#1a1a1a' }]}>{detail.value}</Text>
                )}
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

      {/* Donor Status Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={donorStatusModalVisible}
        onRequestClose={() => setDonorStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            {/* Medal Icon with Glow */}
            <View style={[styles.donorModalIconContainer, { backgroundColor: isDark ? levelColors.bgDark : levelColors.bg }]}>
              <Ionicons name="medal" size={48} color={isDark ? levelColors.textDark : levelColors.text} />
            </View>
            
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#111827' }]}>
              {getDonorLevelLabel(donorLevel)}
            </Text>
            <Text style={[styles.donorModalSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {donationCount} {donationCount === 1 ? 'donation' : 'donations'} completed
            </Text>
            
            {/* Progress Section */}
            <View style={styles.donorProgressSection}>
              {/* Level Indicators */}
              <View style={styles.levelIndicators}>
                <View style={styles.levelIndicator}>
                  <View style={[styles.levelDot, { backgroundColor: DONOR_LEVEL_COLORS.Bronze.text }]} />
                  <Text style={[styles.levelLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Bronze</Text>
                  <Text style={[styles.levelCount, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>0+</Text>
                </View>
                <View style={styles.levelIndicator}>
                  <View style={[styles.levelDot, { backgroundColor: DONOR_LEVEL_COLORS.Silver.text }]} />
                  <Text style={[styles.levelLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Silver</Text>
                  <Text style={[styles.levelCount, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>5+</Text>
                </View>
                <View style={styles.levelIndicator}>
                  <View style={[styles.levelDot, { backgroundColor: DONOR_LEVEL_COLORS.Gold.text }]} />
                  <Text style={[styles.levelLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Gold</Text>
                  <Text style={[styles.levelCount, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>15+</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={[styles.donorProgressBarContainer, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                <LinearGradient
                  colors={donorLevel === 'Gold' ? ['#F59E0B', '#D97706'] : donorLevel === 'Silver' ? ['#9CA3AF', '#6B7280'] : ['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.donorProgressBar, { width: `${Math.max(5, donorProgress.barWidth)}%` }]}
                />
                {/* Level Markers */}
                <View style={[styles.levelMarker, { left: '0%' }]} />
                <View style={[styles.levelMarker, { left: '33.3%' }]} />
                <View style={[styles.levelMarker, { left: '66.6%' }]} />
                <View style={[styles.levelMarker, { left: '100%' }]} />
              </View>
              
              {/* Next Level Info */}
              {donorProgress.nextLevel ? (
                <View style={[styles.nextLevelInfo, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                  <Ionicons name="arrow-up-circle" size={20} color="#10B981" />
                  <Text style={[styles.nextLevelText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                    <Text style={{ fontWeight: '700', color: '#10B981' }}>{donorProgress.donationsToNext} more</Text>
                    {' '}donation{donorProgress.donationsToNext !== 1 ? 's' : ''} to reach{' '}
                    <Text style={{ fontWeight: '700', color: DONOR_LEVEL_COLORS[donorProgress.nextLevel as DonorLevel].text }}>
                      {donorProgress.nextLevel}
                    </Text>
                  </Text>
                </View>
              ) : (
                <View style={[styles.nextLevelInfo, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                  <Ionicons name="trophy" size={20} color="#F59E0B" />
                  <Text style={[styles.nextLevelText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                    🎉 You've reached the highest level!
                  </Text>
                </View>
              )}
            </View>
            
            {/* Close Button */}
            <TouchableOpacity
              style={[styles.donorModalCloseButton, { backgroundColor: isDark ? levelColors.bgDark : levelColors.bg }]}
              onPress={() => setDonorStatusModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.donorModalCloseText, { color: isDark ? levelColors.textDark : levelColors.text }]}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  donorLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  donorLevelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  donorModalIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  donorModalSubtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  donorProgressSection: {
    width: '100%',
    marginBottom: 24,
  },
  levelIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelCount: {
    fontSize: 10,
    marginTop: 2,
  },
  donorProgressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  donorProgressBar: {
    height: '100%',
    borderRadius: 6,
  },
  levelMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ translateX: -1 }],
  },
  nextLevelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  nextLevelText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  donorModalCloseButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorModalCloseText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
