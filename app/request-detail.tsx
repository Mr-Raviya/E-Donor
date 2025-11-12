import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockRequest = {
  bloodType: 'O-',
  unitsNeeded: 2,
  urgency: 'Critical Priority',
  patient: {
    name: 'Sarah Johnson',
    age: '34 years',
    bloodType: 'O-',
    condition: 'Emergency Surgery',
    status: 'Urgent - Active',
    notes:
      'Patient scheduled for emergency surgery following car accident. O- blood type urgently needed for transfusion. Patient is stable but requires immediate intervention.',
  },
  hospital: {
    name: 'City General Hospital',
    department: 'Emergency Department',
    location: 'City Hospital, Downtown',
    distance: '2.1 km',
    contactPerson: 'Dr. Michael Chen',
    contactPhone: '+1 (555) 123-4567',
  },
  timeline: {
    requested: '2 hours ago',
    requestedBy: 'Dr. Michael Chen, Emergency Dept.',
    requiredBy: 'Today, 6:00 PM',
  },
};

export default function RequestDetailScreen() {
  const router = useRouter();
  useLocalSearchParams<{ id?: string }>();
  const data = mockRequest;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <View style={styles.pageBackground}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <TouchableOpacity
                style={styles.heroBack}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.heroTitle}>Blood Request Details</Text>
              <View style={styles.heroSpacer} />
            </View>
            <View style={styles.heroContent}>
              <View style={styles.heroMetrics}>
                <View style={styles.heroIcon}>
                  <Ionicons name="water" size={26} color="#DC2626" />
                </View>
                <View style={styles.heroMetricsText}>
                  <Text style={styles.heroBloodType}>{data.bloodType}</Text>
                  <Text style={styles.heroUnits}>{data.unitsNeeded} units needed</Text>
                </View>
              </View>
              <View style={styles.heroPill}>
                <Ionicons name="medkit" size={14} color="#DC2626" />
                <Text style={styles.heroPillText}>{data.urgency}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="heart-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.cardHeaderText}>Patient Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient Name</Text>
              <Text style={styles.infoValue}>{data.patient.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{data.patient.age}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <View style={styles.outlinedPill}>
                <Text style={styles.outlinedPillText}>{data.patient.bloodType}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medical Condition</Text>
              <Text style={[styles.infoValue, styles.infoValueEmphasis]}>
                {data.patient.condition}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{data.patient.status}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>Medical Notes</Text>
              <Text style={styles.notesValue}>{data.patient.notes}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="business-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.cardHeaderText}>Hospital Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hospital</Text>
              <Text style={styles.infoValue}>{data.hospital.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{data.hospital.department}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{data.hospital.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {data.hospital.distance}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Person</Text>
              <Text style={styles.infoValue}>{data.hospital.contactPerson}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Phone</Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={16} color="#DC2626" />
                <Text style={[styles.infoValue, styles.infoValueAccent]}>
                  {data.hospital.contactPhone}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="time-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.cardHeaderText}>Request Timeline</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Requested</Text>
              <Text style={styles.infoValue}>{data.timeline.requested}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Requested By</Text>
              <Text style={styles.infoValue}>{data.timeline.requestedBy}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Required By</Text>
              <View style={styles.outlinedPill}>
                <Ionicons name="calendar-outline" size={14} color="#EA580C" />
                <Text style={[styles.outlinedPillText, styles.requiredText]}>
                  {data.timeline.requiredBy}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.acceptButton} activeOpacity={0.9}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText} numberOfLines={1}>
              Accept
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.9}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#111827" />
            <Text style={styles.chatButtonText} numberOfLines={1}>
              Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#DC2626' },
  pageBackground: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 120 },
  heroCard: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  heroSpacer: { width: 36 },
  heroContent: {
    alignItems: 'center',
    gap: 12,
  },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
  heroMetricsText: {
    alignItems: 'flex-start',
  },
  heroBloodType: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
    marginLeft: 26,
  },
  heroUnits: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  heroPillText: {
    color: '#B91C1C',
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  infoValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  infoValueEmphasis: { fontSize: 15, color: '#111827', fontWeight: '700' },
  infoValueAccent: { color: '#DC2626' },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  outlinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  outlinedPillText: {
    color: '#EA580C',
    fontWeight: '600',
    fontSize: 13,
  },
  requiredText: { color: '#EA580C' },
  statusPill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusPillText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
  },
  notesBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
  },
  notesLabel: {
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 6,
  },
  notesValue: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'justify',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#F9FAFB',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  chatButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  chatButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
