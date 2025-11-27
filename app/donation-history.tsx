import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { listenToUserDonations, UserDonation } from './services/userDonationService';

const formatDate = (date: Date | null): string => {
  if (!date) return 'Unknown date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusConfig = (status: UserDonation['status']) => {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'time-outline' as const };
    case 'scheduled':
      return { label: 'Scheduled', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'calendar-outline' as const };
    case 'completed':
      return { label: 'Completed', color: '#16A34A', bgColor: '#DCFCE7', icon: 'checkmark-circle' as const };
    case 'cancelled':
      return { label: 'Cancelled', color: '#EF4444', bgColor: '#FEE2E2', icon: 'close-circle-outline' as const };
    default:
      return { label: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6', icon: 'help-circle-outline' as const };
  }
};

export default function DonationHistoryScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { themeMode } = useAppearance();
  const { session } = useUser();
  const isDark = themeMode === 'dark';
  const [selectedDonation, setSelectedDonation] = useState<string | null>(null);
  const [donations, setDonations] = useState<UserDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToUserDonations(
      session.uid,
      (data) => {
        setDonations(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading donations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [session?.uid]);

  const completedCount = donations.filter(d => d.status === 'completed').length;
  const pendingCount = donations.filter(d => d.status === 'pending').length;
  const livesSaved = completedCount * 3; // Each donation can save up to 3 lives

  const getDonorLevel = () => {
    if (completedCount >= 10) return 'Gold';
    if (completedCount >= 5) return 'Silver';
    return 'Bronze';
  };

  const styles = createStyles(isDark);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a1a' }]}>{t('donationHistory')}</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Loading donations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a1a' }]}>{t('donationHistory')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#FEE2E2', '#FECACA']}
          style={styles.statCard}
        >
          <Ionicons name="water" size={24} color="#DC2626" />
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>{completedCount}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('totalDonations')}</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#DBEAFE', '#BFDBFE']}
          style={styles.statCard}
        >
          <Ionicons name="people" size={24} color="#2563EB" />
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>{livesSaved}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('livesSaved')}</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#FEF3C7', '#FDE68A']}
          style={styles.statCard}
        >
          <Ionicons name="medal" size={24} color="#D97706" />
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>{getDonorLevel()}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('donorStatus')}</Text>
        </LinearGradient>
      </View>

      {/* Donation List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pendingCount > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>
              Pending Donations ({pendingCount})
            </Text>
            {donations.filter(d => d.status === 'pending').map((donation) => {
              const statusConfig = getStatusConfig(donation.status);
              return (
                <TouchableOpacity
                  key={donation.id}
                  style={[
                    styles.donationCard,
                    { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
                    selectedDonation === donation.id && styles.selectedCard
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDonation(selectedDonation === donation.id ? null : donation.id)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={[statusConfig.bgColor, statusConfig.bgColor]}
                        style={styles.iconBg}
                      >
                        <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
                      </LinearGradient>
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={[styles.facilityName, { color: isDark ? '#fff' : '#1a1a1a' }]}>
                        {donation.hospital}
                      </Text>
                      <Text style={[styles.caseType, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {donation.medicalCondition || 'Blood Donation'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.bgColor }]}>
                      <Text style={[styles.statusTextSmall, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                      <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                        {formatDate(donation.acceptedAt)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                      <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                        {donation.location || 'Location not specified'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="water" size={16} color="#9CA3AF" />
                      <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                        {donation.units} unit{donation.units > 1 ? 's' : ''} • {donation.bloodType}
                      </Text>
                    </View>
                  </View>

                  {selectedDonation === donation.id && (
                    <View style={[styles.expandedContent, { borderTopColor: isDark ? '#3a3a3a' : '#E5E7EB' }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                          Patient Name
                        </Text>
                        <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#1a1a1a' }]}>
                          {donation.patientName}
                        </Text>
                      </View>
                      {donation.notes && (
                        <>
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                              Notes
                            </Text>
                          </View>
                          <Text style={[styles.notesText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                            {donation.notes}
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a', marginTop: pendingCount > 0 ? 16 : 0 }]}>
          All Donations ({donations.length})
        </Text>
        
        {donations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>
              No Donations Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Accept a blood request to start your donation journey
            </Text>
          </View>
        ) : (
          donations.filter(d => d.status !== 'pending').map((donation) => {
            const statusConfig = getStatusConfig(donation.status);
            return (
              <TouchableOpacity
                key={donation.id}
                style={[
                  styles.donationCard,
                  { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
                  selectedDonation === donation.id && styles.selectedCard
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedDonation(selectedDonation === donation.id ? null : donation.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={[statusConfig.bgColor, statusConfig.bgColor]}
                      style={styles.iconBg}
                    >
                      <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
                    </LinearGradient>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={[styles.facilityName, { color: isDark ? '#fff' : '#1a1a1a' }]}>
                      {donation.hospital}
                    </Text>
                    <Text style={[styles.caseType, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      {donation.medicalCondition || 'Blood Donation'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={[styles.statusTextSmall, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                    <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                      {formatDate(donation.completedAt || donation.acceptedAt)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                    <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                      {donation.location || 'Location not specified'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="water" size={16} color="#9CA3AF" />
                    <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                      {donation.units} unit{donation.units > 1 ? 's' : ''} • {donation.bloodType}
                    </Text>
                  </View>
                </View>

                {selectedDonation === donation.id && (
                  <View style={[styles.expandedContent, { borderTopColor: isDark ? '#3a3a3a' : '#E5E7EB' }]}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Patient Name
                      </Text>
                      <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#1a1a1a' }]}>
                        {donation.patientName}
                      </Text>
                    </View>
                    {donation.notes && (
                      <>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Notes
                          </Text>
                        </View>
                        <Text style={[styles.notesText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                          {donation.notes}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#3a3a3a' : '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  donationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  caseType: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
