import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from './contexts/AppearanceContext';
import { useLocalization } from './contexts/LocalizationContext';

const donationData = [
  {
    id: 'd1',
    facility: 'Lanka Hospitals',
    caseType: 'Emergency Surgery',
    patientName: 'Kamal Silva',
    units: 1,
    date: '2024-08-15',
    bloodType: 'O+',
    status: 'completed',
    location: 'Colombo 05',
    notes: 'Successfully donated for emergency surgery case',
  },
  {
    id: 'd2',
    facility: 'National Blood Centre',
    caseType: 'Cancer Patient',
    patientName: 'Sunil Fernando',
    units: 1,
    date: '2024-06-20',
    bloodType: 'O+',
    status: 'completed',
    location: 'Colombo 07',
    notes: 'Regular donation for cancer treatment',
  },
  {
    id: 'd3',
    facility: 'Nawaloka Hospital',
    caseType: 'Accident Victim',
    patientName: 'Chamari Jayasinghe',
    units: 1,
    date: '2024-04-10',
    bloodType: 'O+',
    status: 'completed',
    location: 'Colombo 02',
    notes: 'Emergency response donation',
  },
  {
    id: 'd4',
    facility: 'Asiri Surgical Hospital',
    caseType: 'Surgery Patient',
    patientName: 'Nuwan Wijesinghe',
    units: 2,
    date: '2024-02-15',
    bloodType: 'O+',
    status: 'completed',
    location: 'Colombo 06',
    notes: 'Scheduled surgery donation',
  },
  {
    id: 'd5',
    facility: 'Colombo General Hospital',
    caseType: 'Trauma Patient',
    patientName: 'Sanduni Perera',
    units: 1,
    date: '2024-01-05',
    bloodType: 'O+',
    status: 'completed',
    location: 'Colombo 10',
    notes: 'Emergency trauma case',
  },
  {
    id: 'd6',
    facility: 'National Blood Centre',
    caseType: 'Blood Bank Stock',
    patientName: 'General Stock',
    units: 1,
    date: '2023-11-20',
    bloodType: 'O+',
    status: 'completed',
    location: 'Colombo 07',
    notes: 'Regular blood bank donation',
  },
  {
    id: 'd7',
    facility: 'Durdans Hospital',
    caseType: 'Maternity Care',
    patientName: 'Malini Rajapaksa',
    units: 1,
    date: '2023-09-10',
    bloodType: 'O+',
    status: 'completed',
    location: 'Colombo 03',
    notes: 'Maternity emergency donation',
  },
  {
    id: 'd8',
    facility: 'Hemas Hospital',
    caseType: 'Surgery Preparation',
    patientName: 'Ravi Gunawardena',
    units: 1,
    date: '2023-07-25',
    bloodType: 'O+',
    status: 'completed',
    location: 'Wattala',
    notes: 'Pre-surgery blood donation',
  },
];

export default function DonationHistoryScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { themeMode } = useAppearance();
  const isDark = themeMode === 'dark';
  const [selectedDonation, setSelectedDonation] = useState<string | null>(null);

  const styles = createStyles(isDark);

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
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>12</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('totalDonations')}</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#DBEAFE', '#BFDBFE']}
          style={styles.statCard}
        >
          <Ionicons name="people" size={24} color="#2563EB" />
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>36</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('livesSaved')}</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ['#2a2a2a', '#1f1f1f'] : ['#FEF3C7', '#FDE68A']}
          style={styles.statCard}
        >
          <Ionicons name="medal" size={24} color="#D97706" />
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#1F2937' }]}>Gold</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('donorStatus')}</Text>
        </LinearGradient>
      </View>

      {/* Donation List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#1a1a1a' }]}>
          All Donations ({donationData.length})
        </Text>
        
        {donationData.map((donation) => (
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
                  colors={['#DCFCE7', '#BBF7D0']}
                  style={styles.iconBg}
                >
                  <Ionicons name="heart" size={24} color="#16A34A" />
                </LinearGradient>
              </View>
              <View style={styles.headerInfo}>
                <Text style={[styles.facilityName, { color: isDark ? '#fff' : '#1a1a1a' }]}>
                  {donation.facility}
                </Text>
                <Text style={[styles.caseType, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {donation.caseType}
                </Text>
              </View>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  {donation.date}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                <Text style={[styles.infoText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  {donation.location}
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
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Status
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Notes
                  </Text>
                </View>
                <Text style={[styles.notesText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  {donation.notes}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

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
  successBadge: {
    marginLeft: 8,
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
