import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Image,
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

type UrgencyLevel = 'Critical' | 'Urgent' | 'Moderate';

type RequestCard = {
  id: string;
  bloodType: string;
  urgency: UrgencyLevel;
  facility: string;
  requestTitle: string;
  location: string;
  distance: string;
  units: number;
  timeAgo: string;
};

const urgencyTokens: Record<
  UrgencyLevel,
  { label: string; background: string; textColor: string }
> = {
  Critical: { label: 'Critical', background: '#FEE2E2', textColor: '#DC2626' },
  Urgent: { label: 'Urgent', background: '#FDE68A', textColor: '#B45309' },
  Moderate: { label: 'Moderate', background: '#FEF9C3', textColor: '#A16207' },
};

const requests: RequestCard[] = [
  {
    id: '1',
    bloodType: 'O-',
    urgency: 'Critical',
    facility: 'National Hospital of Sri Lanka',
    requestTitle: 'Emergency Surgery',
    location: 'Colombo 10',
    distance: '2.1 km',
    units: 2,
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    bloodType: 'A+',
    urgency: 'Urgent',
    facility: 'Lanka Hospitals',
    requestTitle: 'Cancer Treatment',
    location: 'Colombo 05',
    distance: '3.5 km',
    units: 1,
    timeAgo: '4 hours ago',
  },
  {
    id: '3',
    bloodType: 'B+',
    urgency: 'Moderate',
    facility: 'Asiri Central Hospital',
    requestTitle: 'Accident Victim',
    location: 'Colombo 08',
    distance: '5.2 km',
    units: 3,
    timeAgo: '1 day ago',
  },
];

const tabs = [
  { key: 'requests', label: 'Find Requests' },
  { key: 'donations', label: 'My Donations' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const donations = [
  {
    id: 'd1',
    facility: 'Lanka Hospitals',
    caseType: 'Emergency Surgery',
    units: 1,
    date: '2024-08-15',
  },
  {
    id: 'd2',
    facility: 'National Blood Centre',
    caseType: 'Cancer Patient',
    units: 1,
    date: '2024-06-20',
  },
  {
    id: 'd3',
    facility: 'Nawaloka Hospital',
    caseType: 'Accident Victim',
    units: 1,
    date: '2024-04-10',
  },
] as const;

export default function HomeScreen() {
  const { t, locale } = useLocalization();
  const { themeMode } = useAppearance();
  const { user } = useUser();
  const isDark = themeMode === 'dark';
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const activeCount = useMemo(() => requests.length, []);
  const router = useRouter();

  const styles = createStyles(isDark, locale);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]} edges={['top']}>
      {/* Compact Header */}
      <View style={[styles.header, { 
        backgroundColor: isDark ? '#2a2a2a' : '#fff',
        borderBottomColor: isDark ? '#3a3a3a' : '#e0e0e0'
      }]}>
        <View style={styles.headerContent}>
          {/* Left: App Name */}
          <View style={styles.headerLeftSection}>
            <Text style={styles.appName}>  E-Donor</Text>
          </View>

          {/* Right: Icons Row */}
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconButton} onPress={() => router.push('/notifications')}>
              <View style={styles.notificationDot} />
              <Ionicons name="notifications" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={() => router.push('/chat')}>
              <Ionicons name="chatbubble-ellipses" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={() => router.push('/settingspanel')}>
              <Ionicons name="settings" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card - Apple Inspired Single Line */}
        <TouchableOpacity
          style={[styles.profileCardLarge, { marginHorizontal: 20, marginTop: 16, marginBottom: 20 }]}
          activeOpacity={0.8}
          onPress={() => router.push('/profile')}
        >
          <LinearGradient
            colors={isDark ? ['#374151', '#1F2937'] : ['#E5E7EB', '#D1D5DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardGradient}
          >
            <View style={styles.profileCardContent}>
              {/* Left: Avatar */}
              {user.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.appleAvatar}
                />
              ) : (
                <LinearGradient
                  colors={isDark ? ['#6B7280', '#4B5563'] : ['#9CA3AF', '#6B7280']}
                  style={styles.appleAvatar}
                >
                  <Text style={styles.appleAvatarText}>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </LinearGradient>
              )}

              {/* Middle: User Info - Single Line */}
              <View style={styles.appleProfileInfo}>
                <Text style={styles.appleProfileName} numberOfLines={1}>{user.name}</Text>
                <View style={styles.appleProfileMeta}>
                  <Text style={styles.appleProfileBadge}>Gold Donor</Text>
                  <View style={styles.appleDivider} />
                  <Text style={styles.appleProfileLocation} numberOfLines={1}>{user.location}</Text>
                </View>
              </View>

              {/* Right: Blood Type */}
              <View style={styles.appleBloodTypeBox}>
                <Ionicons name="water" size={14} color="#FFFFFF" />
                <Text style={styles.appleBloodTypeText}>{user.bloodType}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={[styles.statsContainer, { marginHorizontal: 24, marginBottom: 24 }]}>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.9}>
            <LinearGradient
              colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#FEE2E2', '#FECACA']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255,255,255,0.9)' }]}>
                <Ionicons name="heart" size={20} color="#DC2626" />
              </View>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>12</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#ccc' : '#374151' }]}>Total Donations</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.9}>
            <LinearGradient
              colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#DBEAFE', '#BFDBFE']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.9)' }]}>
                <Ionicons name="people" size={20} color="#2563EB" />
              </View>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>36</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#ccc' : '#374151' }]}>Lives Saved</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.9}>
            <LinearGradient
              colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#FEF3C7', '#FDE68A']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : 'rgba(255,255,255,0.9)' }]}>
                <Ionicons name="ribbon" size={20} color="#D97706" />
              </View>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>Gold</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#ccc' : '#374151' }]}>Donor Status</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.9}
              >
                <Ionicons 
                  name={tab.key === 'requests' ? 'medical' : 'time'} 
                  size={18} 
                  color={isActive ? (isDark ? '#fff' : '#1F2937') : (isDark ? '#666' : '#6B7280')} 
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'requests' ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('urgentBloodRequests')}</Text>
                <Text style={styles.sectionSubtitle}>{t('helpSaveLives')}</Text>
              </View>
              <View style={styles.activeBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.activeBadgeText}>{activeCount} {t('activeBadge')}</Text>
              </View>
            </View>

            <View style={styles.requestList}>
              {requests.map((request) => {
                const urgency = urgencyTokens[request.urgency];
                return (
                  <TouchableOpacity 
                    key={request.id} 
                    style={styles.requestCard}
                    activeOpacity={0.95}
                    onPress={() => router.push({ pathname: '/request-detail', params: { id: request.id } })}
                  >
                    <LinearGradient
                      colors={isDark ? ['#2a2a2a', '#2a2a2a'] : ['#FFFFFF', '#FFFFFF']}
                      style={styles.requestCardGradient}
                    >
                      {/* Blood Type Badge */}
                      <View style={styles.bloodTypeSection}>
                        <LinearGradient
                          colors={['#DC2626', '#B91C1C']}
                          style={styles.bloodTypeBadge}
                        >
                          <Ionicons name="water" size={14} color="#FFFFFF" />
                          <Text style={styles.bloodTypeTextLarge}>{request.bloodType}</Text>
                        </LinearGradient>
                        <View style={styles.requestMeta}>
                          <View style={[styles.urgencyBadge, { backgroundColor: urgency.background }]}>
                            <View style={[styles.urgencyDot, { backgroundColor: urgency.textColor }]} />
                            <Text style={[styles.urgencyLabel, { color: urgency.textColor }]}>
                              {urgency.label}
                            </Text>
                          </View>
                          <Text style={styles.timeAgoText}>{request.timeAgo}</Text>
                        </View>
                      </View>

                      {/* Request Info */}
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestTitleText}>{request.requestTitle}</Text>
                        <Text style={styles.facilityName}>{request.facility}</Text>
                        
                        <View style={styles.requestDetails}>
                          <View style={styles.detailItem}>
                            <Ionicons name="location" size={14} color="#DC2626" />
                            <Text style={styles.detailText}>{request.distance}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="medkit" size={14} color="#DC2626" />
                            <Text style={styles.detailText}>{request.units} units needed</Text>
                          </View>
                        </View>
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity 
                        style={styles.respondButtonSmall}
                        onPress={() => router.push({ pathname: '/request-detail', params: { id: request.id } })}
                      >
                        <Text style={styles.respondTextSmall}>{t('respond')}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('donationHistory')}</Text>
                <Text style={styles.sectionSubtitle}>Your contribution journey</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/donation-history')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>

            <View style={styles.donationList}>
              {donations.map((donation, index) => (
                <TouchableOpacity key={donation.id} style={styles.donationCard} activeOpacity={0.9}>
                  <View style={styles.donationIconContainer}>
                    <LinearGradient
                      colors={['#DCFCE7', '#BBF7D0']}
                      style={styles.donationIconBg}
                    >
                      <Ionicons name="heart" size={22} color="#16A34A" />
                    </LinearGradient>
                  </View>
                  <View style={styles.donationContent}>
                    <Text style={styles.donationFacility}>{donation.facility}</Text>
                    <Text style={styles.donationCase}>{donation.caseType}</Text>
                    <View style={styles.donationFooter}>
                      <View style={styles.donationMetaItem}>
                        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.donationDate}>{donation.date}</Text>
                      </View>
                      <View style={styles.donationMetaItem}>
                        <Ionicons name="water" size={12} color="#9CA3AF" />
                        <Text style={styles.donationUnits}>{donation.units} unit</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean, locale: 'en' | 'si' | 'ta') => {
  const colors = {
    primary: '#DC2626',
    primaryLight: '#FEE2E2',
    backgroundSecondary: isDark ? '#1F2937' : '#F9FAFB',
    cardBackground: isDark ? '#374151' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#4B5563' : '#E5E7EB',
  };
  // Reduce font size by 2 for Sinhala and Tamil
  const fontReduction = (locale === 'si' || locale === 'ta') ? 4 : 0;
  const baseFontSize = 14 - fontReduction;
  
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
  },
  header: {
    backgroundColor: isDark ? '#2a2a2a' : '#fff',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appName: {
    fontSize: baseFontSize + 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  greetingContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: baseFontSize - 3,
    marginBottom: 2,
  },
  headerUserName: {
    fontSize: baseFontSize + 4,
    fontWeight: '700',
  },
  profileIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  profileCardLarge: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  profileCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  appleAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  appleAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appleProfileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  appleProfileName: {
    color: isDark ? '#FFFFFF' : '#1F2937',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  appleProfileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appleProfileBadge: {
    color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(31,41,55,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  appleDivider: {
    width: 1,
    height: 10,
    backgroundColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(31,41,55,0.3)',
  },
  appleProfileLocation: {
    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(31,41,55,0.8)',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  appleBloodTypeBox: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  appleBloodTypeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  profileCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FCD34D',
    borderWidth: 2,
    borderColor: isDark ? '#2a2a2a' : '#fff',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: baseFontSize + 6,
    fontWeight: '700',
  },
  bloodBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bloodBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: baseFontSize + 2,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(252, 211, 77, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 5,
  },
  statCardGradient: {
    padding: 12,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 11,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: isDark ? '#1a1a1a' : '#E5E7EB',
    borderRadius: 16,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    color: isDark ? '#666' : '#6B7280',
    fontSize: baseFontSize,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: isDark ? '#fff' : '#1F2937',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: baseFontSize + 6,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: baseFontSize - 2,
    color: colors.textSecondary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  activeBadgeText: {
    color: colors.primary,
    fontSize: baseFontSize - 2,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: baseFontSize - 1,
    fontWeight: '600',
  },
  requestList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  requestCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  requestCardGradient: {
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  bloodTypeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bloodTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  bloodTypeTextLarge: {
    color: '#FFFFFF',
    fontSize: baseFontSize + 6,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  requestMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyLabel: {
    fontSize: baseFontSize - 2,
    fontWeight: '700',
  },
  timeAgoText: {
    fontSize: baseFontSize - 3,
    color: isDark ? '#999' : '#6B7280',
  },
  requestInfo: {
    marginBottom: 12,
  },
  requestTitleText: {
    fontSize: baseFontSize + 1,
    fontWeight: '700',
    color: isDark ? '#ffffff' : '#1F2937',
    marginBottom: 3,
  },
  facilityName: {
    fontSize: baseFontSize - 1,
    color: isDark ? '#aaa' : '#6B7280',
    marginBottom: 8,
  },
  requestDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: baseFontSize - 1,
    color: isDark ? '#ccc' : '#374151',
    fontWeight: '600',
  },
  respondButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  respondTextSmall: {
    color: '#FFFFFF',
    fontSize: baseFontSize,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  donationList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  donationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  donationIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  donationIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  donationNumber: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  donationNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  donationContent: {
    flex: 1,
  },
  donationFacility: {
    fontSize: baseFontSize + 2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  donationCase: {
    fontSize: baseFontSize,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  donationFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  donationMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  donationDate: {
    fontSize: baseFontSize - 2,
    color: colors.textSecondary,
  },
  donationUnits: {
    fontSize: baseFontSize - 2,
    color: colors.textSecondary,
  },
  successBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
});
};
