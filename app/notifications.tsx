import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../lib/firebase';
import { useAppearance } from './contexts/AppearanceContext';
import { useLocalization } from './contexts/LocalizationContext';
import {
    clearAllUserNotifications,
    deleteUserNotification,
    listenToUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    UserNotification
} from './services/notificationService';

type NotificationType = 'critical' | 'urgent' | 'info' | 'success' | 'general' | 'reminder' | 'event';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export default function NotificationsScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { themeMode } = useAppearance();
  const isDark = themeMode === 'dark';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const styles = createStyles(isDark);

  // Real-time listener for user notifications
  useEffect(() => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenToUserNotifications(
      currentUser.uid,
      (firebaseNotifications: UserNotification[]) => {
        // Convert Firebase notifications to display format
        const formattedNotifications: NotificationItem[] = firebaseNotifications.map((notif) => {
          const timeAgo = getTimeAgo(notif.receivedAt?.toDate?.() || new Date());
          
          return {
            id: notif.id,
            type: mapNotificationType(notif.type),
            title: notif.title,
            body: notif.message,
            time: timeAgo,
            read: notif.read,
          };
        });

        setNotifications(formattedNotifications);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Map notification types
  const mapNotificationType = (type: string): NotificationType => {
    const typeMap: Record<string, NotificationType> = {
      'critical': 'critical',
      'urgent': 'urgent',
      'info': 'info',
      'success': 'success',
      'general': 'info',
      'reminder': 'info',
      'event': 'info',
    };
    return typeMap[type] || 'info';
  };

  // Calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  async function markAllRead() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await markAllNotificationsAsRead(currentUser.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function clearAll() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await clearAllUserNotifications(currentUser.uid);
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  async function deleteNotification(id: string) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await deleteUserNotification(id, currentUser.uid);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  async function toggleRead(id: string) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.read) return;

    try {
      await markNotificationAsRead(id, currentUser.uid);
      setNotifications((prev) => 
        prev.map((n) => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Open notification detail modal
  const openNotificationDetail = async (notification: NotificationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNotification(notification);
    setModalVisible(true);
    
    // Mark as read when opened
    if (!notification.read) {
      await toggleRead(notification.id);
    }
  };

  // Close notification detail modal
  const closeNotificationDetail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const displayedNotifications = notifications.filter((n) => 
    activeTab === 'unread' ? !n.read : true
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Clean Header - No Red Gradient */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('notificationsScreen')}</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead} style={styles.headerActionBtn}>
          <Ionicons name="checkmark-done" size={22} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      {/* Modern Switch Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={18} color={activeTab === 'all' ? (isDark ? '#fff' : '#1F2937') : (isDark ? '#666' : '#6B7280')} />
            <Text style={[styles.tabLabel, activeTab === 'all' && styles.tabLabelActive]}>
              {t('all')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'unread' && styles.tabButtonActive]}
            onPress={() => setActiveTab('unread')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-unread" size={18} color={activeTab === 'unread' ? (isDark ? '#fff' : '#1F2937') : (isDark ? '#666' : '#6B7280')} />
            <Text style={[styles.tabLabel, activeTab === 'unread' && styles.tabLabelActive]}>
              {t('unread')}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <View style={styles.clearAllContainer}>
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={clearAll}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.clearAllText}>{t('clearAllNotifications')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC143C" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : displayedNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={isDark ? ['#374151', '#4B5563'] : ['#F3F4F6', '#E5E7EB']}
              style={styles.emptyIconContainer}
            >
              <Ionicons 
                name={activeTab === 'unread' ? 'checkmark-done-circle' : 'notifications-off'} 
                size={64} 
                color={isDark ? '#B0B3B8' : '#65676B'} 
              />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {activeTab === 'unread' ? t('allCaughtUp') : t('noNotifications')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'unread' 
                ? t('noUnreadNotifications') 
                : t('noNotificationsAtMoment')}
            </Text>
          </View>
        ) : (
          displayedNotifications.map((notification) => {
            const notifConfig = getNotificationConfig(notification.type);
            
            return (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationCard}
                onPress={() => openNotificationDetail(notification)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  {/* Left: Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: notifConfig.gradient[0] }]}>
                    <Ionicons 
                      name={notifConfig.icon as any} 
                      size={22} 
                      color="#FFFFFF" 
                    />
                  </View>

                  {/* Middle: Content */}
                  <View style={styles.contentContainer}>
                    <View style={styles.contentHeader}>
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    
                    <Text style={styles.notificationBody} numberOfLines={2}>
                      {notification.body}
                    </Text>
                    
                    <Text style={styles.timeText}>{notification.time}</Text>
                  </View>

                  {/* Right: Delete */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={isDark ? '#666' : '#9CA3AF'} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Notification Detail Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={closeNotificationDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedNotification && (
              <>
                {/* Notification Icon */}
                <View style={[
                  styles.modalIconContainer, 
                  { backgroundColor: getNotificationConfig(selectedNotification.type).gradient[0] }
                ]}>
                  <Ionicons 
                    name={getNotificationConfig(selectedNotification.type).icon as any} 
                    size={40} 
                    color="#FFFFFF" 
                  />
                </View>

                {/* Notification Title */}
                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>

                {/* Notification Time */}
                <View style={styles.modalTimeContainer}>
                  <Ionicons name="time-outline" size={16} color={isDark ? '#999' : '#6B7280'} />
                  <Text style={styles.modalTime}>{selectedNotification.time}</Text>
                </View>

                {/* Full Message */}
                <ScrollView style={styles.modalMessageScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalMessage}>{selectedNotification.body}</Text>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={styles.modalDismissButton}
                    onPress={closeNotificationDetail}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalDismissText}>{t('close') || 'Close'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalDeleteButton}
                    onPress={() => {
                      deleteNotification(selectedNotification.id);
                      closeNotificationDetail();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.modalDeleteText}>{t('delete') || 'Delete'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getNotificationConfig(type: NotificationType) {
  switch (type) {
    case 'critical':
      return {
        gradient: ['#DC2626', '#991B1B'],
        icon: 'alert-circle',
      };
    case 'urgent':
      return {
        gradient: ['#F97316', '#EA580C'],
        icon: 'flame',
      };
    case 'success':
      return {
        gradient: ['#10B981', '#059669'],
        icon: 'checkmark-circle',
      };
    case 'info':
    default:
      return {
        gradient: ['#3B82F6', '#2563EB'],
        icon: 'information-circle',
      };
  }
}

const createStyles = (isDark: boolean) => {
  const colors = {
    primary: '#DC2626',
    primaryLight: '#FEE2E2',
    backgroundSecondary: isDark ? '#18191A' : '#F0F2F5',
    cardBackground: isDark ? '#242526' : '#FFFFFF',
    text: isDark ? '#E4E6EB' : '#050505',
    textSecondary: isDark ? '#B0B3B8' : '#65676B',
    border: isDark ? '#3A3B3C' : '#CED0D4',
    hoverBg: isDark ? '#3A3B3C' : '#F2F3F5',
  };
  const baseFontSize = 14;
  
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3a3a3a' : '#e0e0e0',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    headerTitle: {
      color: isDark ? '#fff' : '#1a1a1a',
      fontSize: baseFontSize + 4,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    headerBadge: {
      backgroundColor: '#DC2626',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    headerBadgeText: {
      color: '#FFFFFF',
      fontSize: baseFontSize - 2,
      fontWeight: '700',
    },
    headerActionBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    
    // Modern Switch Tabs
    tabsContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2a2a2a' : '#E5E7EB',
      borderRadius: 16,
      padding: 3,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: 'transparent',
    },
    tabButtonActive: {
      backgroundColor: isDark ? '#3a3a3a' : '#FFFFFF',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 4,
    },
    tabLabel: {
      color: isDark ? '#666' : '#6B7280',
      fontSize: baseFontSize - 1,
      fontWeight: '600',
    },
    tabLabelActive: {
      color: isDark ? '#fff' : '#1F2937',
      fontWeight: '700',
    },
    countBadge: {
      backgroundColor: '#DC2626',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
      marginLeft: 4,
    },
    countBadgeText: {
      color: '#FFFFFF',
      fontSize: baseFontSize - 4,
      fontWeight: '700',
    },
    
    // Clear All Button
    clearAllContainer: {
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    clearAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#3A3B3C' : '#FEE2E2',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#FECACA',
    },
    clearAllText: {
      fontSize: baseFontSize,
      fontWeight: '700',
      color: '#DC2626',
      letterSpacing: 0.3,
    },
    
    // Scroll Content
    scrollContent: {
      padding: 12,
      paddingBottom: 24,
    },
    
    // Notification Cards
    notificationCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF',
      marginBottom: 10,
      borderRadius: 14,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDark ? '#3a3a3a' : '#E5E7EB',
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    notificationUnread: {
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
    },
    cardGradient: {
      flexDirection: 'row',
      padding: 12,
      gap: 12,
    },
    
    // Icon Container with Gradient
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 4,
    },
    
    // Content
    contentContainer: {
      flex: 1,
      gap: 8,
    },
    contentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    notificationTitle: {
      fontSize: baseFontSize + 1,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      letterSpacing: 0.2,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
    notificationBody: {
      fontSize: baseFontSize,
      color: colors.textSecondary,
      lineHeight: 20,
      fontWeight: '400',
    },
    
    // Footer with Actions
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: baseFontSize - 2,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#DC2626',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    actionButtonGradient: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: baseFontSize - 1,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    deleteBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.hoverBg,
    },
    
    // Empty State
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 32,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 4,
    },
    emptyTitle: {
      fontSize: baseFontSize + 4,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    emptySubtitle: {
      fontSize: baseFontSize,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    
    // Loading State
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    loadingText: {
      marginTop: 16,
      fontSize: baseFontSize,
      color: colors.textSecondary,
    },

    // Notification Detail Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      maxHeight: '70%',
      backgroundColor: isDark ? '#2a2a2a' : '#FFFFFF',
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
      elevation: 10,
    },
    modalIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 6,
    },
    modalTitle: {
      fontSize: baseFontSize + 6,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    modalTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    modalTime: {
      fontSize: baseFontSize - 1,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    modalMessageScroll: {
      maxHeight: 150,
      width: '100%',
      marginBottom: 24,
    },
    modalMessage: {
      fontSize: baseFontSize + 1,
      lineHeight: 24,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    modalButtonRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalDismissButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#3a3a3a' : '#F3F4F6',
    },
    modalDismissText: {
      fontSize: baseFontSize + 1,
      fontWeight: '600',
      color: colors.text,
    },
    modalDeleteButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 14,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DC2626',
      gap: 8,
    },
    modalDeleteText: {
      fontSize: baseFontSize + 1,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
};
