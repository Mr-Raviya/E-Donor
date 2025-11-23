import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendNotification, listenToAdminNotifications } from './services/notificationService';
import { auth } from '../lib/firebase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'reminder' | 'event';
  targetAudience: 'all' | 'donors' | 'recipients' | 'specific';
  sentDate: string;
  sentBy: string;
  readCount: number;
  totalSent: number;
}

const notificationTemplates = [
  {
    id: '1',
    title: 'Urgent Blood Needed',
    message: 'Critical shortage of {bloodType}. Please donate if you can.',
    type: 'urgent' as const,
  },
  {
    id: '2',
    title: 'Blood Drive Event',
    message: 'Join us for a blood donation drive at {location} on {date}.',
    type: 'event' as const,
  },
  {
    id: '3',
    title: 'Donation Reminder',
    message: "It's been 3 months since your last donation. Ready to save lives again?",
    type: 'reminder' as const,
  },
  {
    id: '4',
    title: 'Thank You',
    message: 'Thank you for your recent donation! You helped save lives.',
    type: 'general' as const,
  },
];

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Emergency: O- Blood Needed',
    message: 'Critical shortage of O- blood. Multiple patients in need.',
    type: 'urgent',
    targetAudience: 'donors',
    sentDate: '2024-11-16',
    sentBy: 'Admin',
    readCount: 456,
    totalSent: 678,
  },
  {
    id: '2',
    title: 'Blood Drive This Weekend',
    message: 'Join us at City Park for our community blood drive on Saturday.',
    type: 'event',
    targetAudience: 'all',
    sentDate: '2024-11-15',
    sentBy: 'Admin',
    readCount: 892,
    totalSent: 1247,
  },
];

export default function AdminNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof notificationTemplates[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'general' as Notification['type'],
    targetAudience: 'all' as Notification['targetAudience'],
  });

  // Real-time listener for notifications
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = listenToAdminNotifications(
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        Alert.alert('Error', 'Failed to load notifications');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    setSending(true);

    try {
      const currentUser = auth.currentUser;
      const sentBy = currentUser?.displayName || currentUser?.email || 'Admin';

      await sendNotification({
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        targetAudience: newNotification.targetAudience,
        sentBy: sentBy,
      });

      setShowSendModal(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'general',
        targetAudience: 'all',
      });
      setSelectedTemplate(null);
      
      Alert.alert('Success', 'Notification sent successfully to users!');
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return { bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle' as const };
      case 'event':
        return { bg: '#DBEAFE', text: '#2563EB', icon: 'calendar' as const };
      case 'reminder':
        return { bg: '#FEF3C7', text: '#CA8A04', icon: 'time' as const };
      default:
        return { bg: '#E0E7FF', text: '#4F46E5', icon: 'notifications' as const };
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const typeColors = getTypeColor(item.type);
    const readPercentage = ((item.readCount / item.totalSent) * 100).toFixed(0);

    return (
      <View style={styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
            <Ionicons name={typeColors.icon} size={16} color={typeColors.text} />
            <Text style={[styles.typeText, { color: typeColors.text }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.sentDate}>{item.sentDate}</Text>
        </View>

        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>

        <View style={styles.audienceRow}>
          <Ionicons name="people" size={16} color="#666" />
          <Text style={styles.audienceText}>
            Sent to: <Text style={styles.audienceValue}>{item.targetAudience}</Text>
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="send" size={16} color="#4F46E5" />
            <Text style={styles.statText}>{item.totalSent} sent</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={16} color="#059669" />
            <Text style={styles.statText}>{item.readCount} read ({readPercentage}%)</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={() => setShowSendModal(true)} style={styles.addButton}>
          <Ionicons name="send" size={24} color="#DC143C" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Total Sent</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {notifications.filter((n) => n.type === 'urgent').length}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Notification History</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No notifications sent yet</Text>
              <Text style={styles.emptySubtext}>Send your first notification to users</Text>
            </View>
          }
        />
      )}

      {/* Send Notification Modal */}
      <Modal visible={showSendModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Notification</Text>
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Templates */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Quick Templates</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.templateList}>
                    {notificationTemplates.map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        style={[
                          styles.templateCard,
                          selectedTemplate?.id === template.id && styles.templateCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedTemplate(template);
                          setNewNotification({
                            ...newNotification,
                            title: template.title,
                            message: template.message,
                            type: template.type,
                          });
                        }}
                      >
                        <Ionicons
                          name={getTypeColor(template.type).icon}
                          size={20}
                          color={getTypeColor(template.type).text}
                        />
                        <Text style={styles.templateTitle}>{template.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Type</Text>
                <View style={styles.typeButtons}>
                  {(['general', 'urgent', 'reminder', 'event'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        newNotification.type === type && styles.typeButtonSelected,
                      ]}
                      onPress={() => setNewNotification({ ...newNotification, type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          newNotification.type === type && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Target Audience */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Target Audience</Text>
                <View style={styles.audienceButtons}>
                  {(['all', 'donors', 'recipients', 'specific'] as const).map((audience) => (
                    <TouchableOpacity
                      key={audience}
                      style={[
                        styles.audienceButton,
                        newNotification.targetAudience === audience && styles.audienceButtonSelected,
                      ]}
                      onPress={() =>
                        setNewNotification({ ...newNotification, targetAudience: audience })
                      }
                    >
                      <Text
                        style={[
                          styles.audienceButtonText,
                          newNotification.targetAudience === audience &&
                            styles.audienceButtonTextSelected,
                        ]}
                      >
                        {audience.charAt(0).toUpperCase() + audience.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={newNotification.title}
                  onChangeText={(text) => setNewNotification({ ...newNotification, title: text })}
                  placeholder="Enter notification title"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Message */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newNotification.message}
                  onChangeText={(text) =>
                    setNewNotification({ ...newNotification, message: text })
                  }
                  placeholder="Enter notification message"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Send Button */}
              <TouchableOpacity 
                style={[styles.sendButton, sending && styles.sendButtonDisabled]} 
                onPress={handleSendNotification}
                disabled={sending}
              >
                <LinearGradient colors={['#DC143C', '#8B0000']} style={styles.sendGradient}>
                  {sending ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.sendButtonText}>Sending...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#fff" />
                      <Text style={styles.sendButtonText}>Send Notification</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    padding: 4,
  },
  statsBar: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC143C',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sentDate: {
    fontSize: 12,
    color: '#999',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  audienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  audienceText: {
    fontSize: 13,
    color: '#666',
  },
  audienceValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  templateList: {
    flexDirection: 'row',
    gap: 12,
  },
  templateCard: {
    width: 140,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: '#DC143C',
    backgroundColor: '#FFE0E0',
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    borderColor: '#DC143C',
    backgroundColor: '#FFE0E0',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextSelected: {
    color: '#DC143C',
  },
  audienceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audienceButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  audienceButtonSelected: {
    borderColor: '#DC143C',
    backgroundColor: '#FFE0E0',
  },
  audienceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  audienceButtonTextSelected: {
    color: '#DC143C',
  },
  input: {
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
});
