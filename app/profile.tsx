import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const basicInfo = [
  { icon: 'mail-outline' as const, label: 'Email', value: 'john.donor@email.com' },
  { icon: 'call-outline' as const, label: 'Phone', value: '+1 (555) 123-4567' },
  { icon: 'location-outline' as const, label: 'Location', value: 'Downtown, City' },
  { icon: 'water-outline' as const, label: 'Blood Type', value: 'O+' },
  { icon: 'calendar-outline' as const, label: 'Member Since', value: 'January 2023' },
];

const additionalDetails = [
  { label: 'Total Donations', value: '12' },
  { label: 'Last Donation', value: 'July 15, 2024' },
  { label: 'Status', value: 'Gold Donor' },
  { label: 'Next Eligible', value: 'October 20, 2024' },
  { label: 'Medical Notes', value: 'No restrictions' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <View style={styles.pageBackground}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" color="#FFFFFF" size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.headerButton} accessibilityLabel="Messages">
              <Ionicons name="chatbubble-ellipses-outline" color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>JD</Text>
          </View>
          <Text style={styles.profileName}>John Donor</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Blood Donor</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.sectionDivider} />
          {basicInfo.map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIcon}>
                  <Ionicons name={item.icon} size={18} color="#6B7280" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <View style={styles.sectionDivider} />
          {additionalDetails.map((detail) => (
            <View key={detail.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.sectionDivider} />
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={18} color="#111827" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.85}
            onPress={() => router.replace('/sign-in')}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#DC2626' },
  pageBackground: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 32 },
  headerCard: {
    backgroundColor: '#DC2626',
    paddingTop: 4,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    gap: 10,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#DC2626',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 0,
  },
  rolePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  sectionCard: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  infoRow: {
    paddingVertical: 10,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    marginTop: 4,
  },
  editButtonText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 18,
    paddingVertical: 14,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
