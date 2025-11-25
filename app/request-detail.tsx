import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { DonationRequest, fetchDonationRequestById } from './services/donationRequestService';

const normalizeUrgencyLabel = (value?: string) => {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('critical')) return 'Critical Priority';
  if (normalized.includes('urgent')) return 'Urgent';
  return 'Normal Priority';
};

const formatTimeAgo = (date?: Date | null): string => {
  if (!date) return 'just now';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hrs ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const formatDistance = (raw?: string): string => {
  if (!raw) return 'Nearby';
  const trimmed = raw.toString().trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed} km away` : trimmed;
};

const buildLocationText = (request: DonationRequest): string => {
  if (request.hospitalLocationText) return request.hospitalLocationText;

  const parts = [
    request.hospitalLocation?.street,
    request.hospitalLocation?.city,
    request.hospitalLocation?.state,
    request.hospitalLocation?.zipCode,
  ].filter(Boolean);

  return parts.join(', ') || 'Location unavailable';
};

const formatRequiredBy = (value?: string): string => {
  if (!value) return 'As soon as possible';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toDateString();
};

export default function RequestDetailScreen() {
  const router = useRouter();
  const { themeMode } = useAppearance();
  const isDark = themeMode === 'dark';
  const params = useLocalSearchParams<{ id?: string }>();
  const requestId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [request, setRequest] = useState<DonationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(isDark);

  useEffect(() => {
    let mounted = true;

    if (!requestId) {
      setError('Missing request id.');
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    fetchDonationRequestById(requestId)
      .then((data) => {
        if (!mounted) return;
        if (!data) {
          setError('Request not found.');
        } else {
          setRequest(data);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Error loading request', err);
        if (mounted) {
          setError('Unable to load this request right now.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [requestId]);

  const displayData = useMemo(() => {
    if (!request) return null;
    return {
      bloodType: request.bloodType || 'N/A',
      unitsNeeded: request.units || 0,
      urgency: normalizeUrgencyLabel(request.priorityLevel || request.urgency || request.patientStatus),
      patientName: request.patientName || 'Unknown patient',
      patientAge: request.patientAge ? `${request.patientAge} years` : 'Age not specified',
      patientBloodType: request.bloodType || 'N/A',
      condition: request.medicalCondition || 'Not provided',
      status: request.patientStatus || request.status || 'Pending',
      notes: request.notes || 'No additional notes provided.',
      hospitalName: request.hospital || 'Hospital',
      department: request.hospitalDepartment || 'Department not specified',
      location: buildLocationText(request),
      distance: formatDistance(request.hospitalDistance),
      contactPerson: request.contactPerson || 'Hospital contact',
      contactPhone: request.contactPhone || request.hospitalPhone || 'Not provided',
      requestedTime: formatTimeAgo(request.createdAt),
      requestedBy: request.contactPerson || request.hospital || 'Hospital team',
      requiredBy: formatRequiredBy(request.date),
    };
  }, [request]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.pageBackground, styles.centeredState]}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!displayData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.pageBackground, styles.centeredState]}>
          <Text style={styles.errorTitle}>Unable to load request</Text>
          <Text style={styles.errorSubtitle}>{error || 'Please try again later.'}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            <Text style={styles.errorButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.pageBackground}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#DC2626', '#B91C1C']}
            style={styles.heroCard}
          >
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
                  <Text style={styles.heroBloodType}>{displayData.bloodType}</Text>
                  <Text style={styles.heroUnits}>{displayData.unitsNeeded} units needed</Text>
                </View>
              </View>
              <View style={styles.heroPill}>
                <Ionicons name="medkit" size={14} color="#DC2626" />
                <Text style={styles.heroPillText}>{displayData.urgency}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="heart-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.cardHeaderText}>Patient Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient Name</Text>
              <Text style={styles.infoValue}>{displayData.patientName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{displayData.patientAge}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <View style={styles.outlinedPill}>
                <Text style={styles.outlinedPillText}>{displayData.patientBloodType}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medical Condition</Text>
              <Text style={[styles.infoValue, styles.infoValueEmphasis]}>
                {displayData.condition}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{displayData.status}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>Medical Notes</Text>
              <Text style={styles.notesValue}>{displayData.notes}</Text>
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
              <Text style={styles.infoValue}>{displayData.hospitalName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{displayData.department}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{displayData.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {displayData.distance}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Person</Text>
              <Text style={styles.infoValue}>{displayData.contactPerson}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Phone</Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={16} color="#DC2626" />
                <Text style={[styles.infoValue, styles.infoValueAccent]}>
                  {displayData.contactPhone}
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
              <Text style={styles.infoValue}>{displayData.requestedTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Requested By</Text>
              <Text style={styles.infoValue}>{displayData.requestedBy}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Required By</Text>
              <View style={styles.outlinedPill}>
                <Ionicons name="calendar-outline" size={14} color="#EA580C" />
                <Text style={[styles.outlinedPillText, styles.requiredText]}>
                  {displayData.requiredBy}
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
          <TouchableOpacity 
            style={styles.chatButton} 
            activeOpacity={0.9}
            onPress={() => router.push({ 
              pathname: '/chat', 
              params: { 
                facilityName: displayData.hospitalName,
                facilityId: request?.hospitalId || displayData.hospitalName.replace(/\s+/g, '-').toLowerCase()
              } 
            })}
          >
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

const createStyles = (isDark: boolean) => {
  const colors = {
    primary: '#DC2626',
    primaryLight: '#FEE2E2',
    backgroundSecondary: isDark ? '#1F2937' : '#F9FAFB',
    cardBackground: isDark ? '#374151' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#4B5563' : '#E5E7EB',
  };
  
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  pageBackground: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 120 },
  heroCard: {
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
    backgroundColor: colors.cardBackground,
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
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  infoValueEmphasis: { fontSize: 15, color: colors.text, fontWeight: '700' },
  infoValueAccent: { color: colors.primary },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
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
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
  },
  notesLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 6,
  },
  notesValue: {
    color: colors.text,
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
    backgroundColor: colors.backgroundSecondary,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary,
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
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cardBackground,
  },
  chatButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
};
