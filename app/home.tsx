import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    facility: 'City General Hospital',
    requestTitle: 'Emergency Surgery',
    location: 'City Hospital, Downtown',
    distance: '2.1 km',
    units: 2,
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    bloodType: 'A+',
    urgency: 'Urgent',
    facility: 'Central Medical Center',
    requestTitle: 'Cancer Treatment',
    location: 'Central Medical Center',
    distance: '3.5 km',
    units: 1,
    timeAgo: '4 hours ago',
  },
  {
    id: '3',
    bloodType: 'B+',
    urgency: 'Moderate',
    facility: 'Community Hospital',
    requestTitle: 'Accident Victim',
    location: 'Community Hospital',
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
    facility: 'City Hospital',
    caseType: 'Emergency Surgery',
    units: 1,
    date: '2024-08-15',
  },
  {
    id: 'd2',
    facility: 'Blood Bank Center',
    caseType: 'Cancer Patient',
    units: 1,
    date: '2024-06-20',
  },
  {
    id: 'd3',
    facility: 'Community Hospital',
    caseType: 'Accident Victim',
    units: 1,
    date: '2024-04-10',
  },
] as const;

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const activeCount = useMemo(() => requests.length, []);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <TouchableOpacity
              style={styles.profileRow}
              activeOpacity={0.8}
              onPress={() => router.push('/profile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View>
                <Text style={styles.nameText}>John Donor</Text>
                <Text style={styles.bloodText}>Blood Type: O+</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconButton} accessibilityLabel="Notifications">
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} accessibilityLabel="Messages">
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} accessibilityLabel="Settings">
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Total Donations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>36</Text>
              <Text style={styles.statLabel}>Lives Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Gold</Text>
              <Text style={styles.statLabel}>Donor Status</Text>
            </View>
          </View>
        </View>

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
                <Text style={styles.sectionTitle}>Nearby Blood Requests</Text>
                <Text style={styles.sectionSubtitle}>
                  Requests close to your current location
                </Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{activeCount} Active</Text>
              </View>
            </View>

            <View style={styles.requestList}>
              {requests.map((request) => {
                const urgency = urgencyTokens[request.urgency];
                return (
                  <View key={request.id} style={styles.requestCard}>
                <LinearGradient
                  colors={['#F97316', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.cardAccent}
                />
                    <View style={styles.cardTopRow}>
                      <View style={styles.bloodInfo}>
                        <View style={styles.bloodIconWrap}>
                          <Ionicons name="water-outline" size={18} color="#DC2626" />
                        </View>
                        <Text style={styles.bloodTypeText}>{request.bloodType}</Text>
                        <View
                          style={[
                            styles.urgencyPill,
                            { backgroundColor: urgency.background },
                          ]}
                        >
                          <Text
                            style={[
                              styles.urgencyText,
                              { color: urgency.textColor },
                            ]}
                          >
                            {urgency.label}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.unitsBlock}>
                        <Text style={styles.unitsText}>{request.units} units</Text>
                        <Text style={styles.timeAgo}>{request.timeAgo}</Text>
                      </View>
                    </View>

                    <View style={styles.requestBody}>
                      <Text style={styles.requestTitle}>{request.requestTitle}</Text>
                      <Text style={styles.facilityText}>{request.facility}</Text>
                    </View>

                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.locationText}>
                        {request.location} • {request.distance}
                      </Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        style={styles.respondButton}
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/request-detail', params: { id: request.id } })}
                      >
                        <Text style={styles.respondText}>Respond</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Donation History</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="ribbon-outline" size={18} color="#CA8A04" />
                <Text style={styles.statusBadgeText}>Gold Donor</Text>
              </View>
            </View>

            <View style={styles.donationList}>
              {donations.map((donation) => (
                <View key={donation.id} style={styles.donationCard}>
                  <View style={styles.donationLeft}>
                    <View style={styles.donationIconWrap}>
                      <Ionicons name="heart" size={18} color="#16A34A" />
                    </View>
                    <View>
                      <Text style={styles.donationFacility}>{donation.facility}</Text>
                      <Text style={styles.donationCase}>{donation.caseType}</Text>
                    </View>
                  </View>
                  <View style={styles.donationMeta}>
                    <Text style={styles.donationUnits}>{donation.units} unit</Text>
                    <Text style={styles.donationDate}>{donation.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DC2626',
  },
  container: {
    flex: 1,
    backgroundColor: '#DC2626',
  },
  contentContainer: {
    paddingBottom: 32,
    backgroundColor: '#F9FAFB',
  },
  heroCard: {
    backgroundColor: '#DC2626',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 32,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FB7185',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  bloodText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: -24,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  tabLabel: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#111827',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 26,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  activeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeBadgeText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  requestList: {
    marginTop: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 6,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  bloodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bloodIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  urgencyPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  unitsBlock: {
    alignItems: 'flex-end',
  },
  unitsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timeAgo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  requestBody: {
    marginTop: 10,
    paddingLeft: 4,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  facilityText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingLeft: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#4B5563',
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  respondButton: {
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  respondText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  donationList: {
    marginTop: 20,
    paddingHorizontal: 24,
    gap: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '600',
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 12,
    elevation: 4,
  },
  donationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donationFacility: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  donationCase: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  donationMeta: {
    alignItems: 'flex-end',
  },
  donationUnits: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  donationDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
});
