import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboardStats } from '../hooks/use-dashboard-stats';
import { useAdmin } from './contexts/AdminContext';
import { useAppearance } from './contexts/AppearanceContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

interface DashboardCard {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: readonly [string, string];
  route: string;
  count?: number | string;
}

const dashboardCards: DashboardCard[] = [
  {
    id: '1',
    title: 'User Management',
    icon: 'people',
    color: ['#4F46E5', '#3730A3'],
    route: '/admin-users',
    count: 0,
  },
  {
    id: '2',
    title: 'Hospital Management',
    icon: 'medical',
    color: ['#059669', '#047857'],
    route: '/admin-hospitals',
    count: 0,
  },
  {
    id: '3',
    title: 'Blood Inventory',
    icon: 'water',
    color: ['#DC2626', '#991B1B'],
    route: '/admin-inventory',
    count: 0,
  },
  {
    id: '4',
    title: 'Blood Requests',
    icon: 'medkit',
    color: ['#EA580C', '#C2410C'],
    route: '/admin-requests',
    count: 0,
  },
  {
    id: '5',
    title: 'Notifications',
    icon: 'notifications',
    color: ['#7C3AED', '#5B21B6'],
    route: '/admin-notifications',
    count: 0,
  },
  {
    id: '6',
    title: 'Settings',
    icon: 'settings',
    color: ['#64748B', '#475569'],
    route: '/admin-settings',
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, logout } = useAdmin();
  const { themeMode } = useAppearance();
  const isDark = themeMode === 'dark';
  const insets = useSafeAreaInsets();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  // Get real-time dashboard statistics
  const stats = useDashboardStats();

  // Update management cards with live counts
  const managementCards = useMemo(
    () => [
      { ...dashboardCards[0], count: stats.totalUsers },
      { ...dashboardCards[1], count: stats.totalHospitals },
      { ...dashboardCards[2], count: stats.totalInventory },
      { ...dashboardCards[3], count: stats.totalRequests },
      { ...dashboardCards[4], count: stats.totalNotifications },
      dashboardCards[5], // Settings - no count
    ],
    [stats],
  );

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logout();
    setLogoutModalVisible(false);
    router.replace('/sign-in');
  };

  const bgColors: readonly [string, string] = isDark ? ['#1a1a1a', '#2d2d2d'] : ['#f8f9fa', '#ffffff'];
  const textColor = isDark ? '#fff' : '#1a1a1a';
  const subtextColor = isDark ? '#999' : '#666';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColors[0] }]}
      edges={['top']}
    >
      <LinearGradient
        colors={bgColors}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: subtextColor }]}>Welcome back,</Text>
              <Text style={[styles.adminName, { color: textColor }]}>{admin?.name || 'Admin'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          
          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name="people" size={24} color="#4F46E5" />
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {stats.totalUsers.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: subtextColor }]}>Total Users</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name="trending-up" size={24} color="#059669" />
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {stats.activeRequests.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: subtextColor }]}>Active Requests</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dashboard Cards */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <Text style={[styles.sectionTitle, { color: textColor }]}>Management Modules</Text>
          <View style={styles.cardsGrid}>
            {managementCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.card}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={card.color}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name={card.icon} size={32} color="#fff" />
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  {card.count !== undefined && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{card.count}</Text>
                    </View>
                  )}
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="rgba(255,255,255,0.8)"
                    style={styles.cardArrow}
                  />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push('/admin-users')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#DC143C', '#8B0000']}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.quickActionText}>Add User</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push('/admin-notifications')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#DC143C', '#8B0000']}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="send" size={24} color="#fff" />
                  <Text style={styles.quickActionText}>Send Alert</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

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
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
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
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
  },
  adminName: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.3)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statInfo: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    lineHeight: 20,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardArrow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 16,
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
