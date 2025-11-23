/**
 * NOTIFICATION INTEGRATION EXAMPLES
 * 
 * Copy-paste these examples into your components to quickly integrate
 * the real-time notification system.
 */

// ============================================
// Example 1: Home Screen with Notification Bell
// ============================================

import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { listenToUserNotifications, getUnreadNotificationCount } from './services/notificationService';
import { auth } from '../lib/firebase';

export default function HomeScreen() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Real-time listener for notifications
    const unsubscribe = listenToUserNotifications(
      currentUser.uid,
      (notifications) => {
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      {/* Notification Bell with Badge */}
      <TouchableOpacity 
        style={styles.notificationBell}
        onPress={() => router.push('/notifications')}
      >
        <Ionicons name="notifications" size={24} color="#1a1a1a" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  notificationBell: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#DC143C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// ============================================
// Example 2: Admin Quick Send Notification
// ============================================

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { sendNotification } from './services/notificationService';
import { auth } from '../lib/firebase';

function QuickSendNotification() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleQuickSend = async () => {
    if (!title || !message) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    setSending(true);
    try {
      await sendNotification({
        title,
        message,
        type: 'info',
        targetAudience: 'all',
        sentBy: auth.currentUser?.email || 'Admin',
      });

      Alert.alert('Success', 'Notification sent to all users!');
      setTitle('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TouchableOpacity 
        onPress={handleQuickSend}
        disabled={sending}
        style={{ 
          backgroundColor: '#DC143C', 
          padding: 15, 
          borderRadius: 8,
          opacity: sending ? 0.6 : 1 
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
          {sending ? 'Sending...' : 'Send to All Users'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// Example 3: Blood Request with Notification
// ============================================

async function createBloodRequestWithNotification(bloodType: string, location: string) {
  try {
    // 1. Create blood request in database
    const requestId = await createBloodRequest({ bloodType, location });

    // 2. Send notification to all donors
    await sendNotification({
      title: `🩸 ${bloodType} Blood Urgently Needed`,
      message: `Critical shortage at ${location}. Your donation can save lives!`,
      type: 'urgent',
      targetAudience: 'donors',
      sentBy: 'Blood Bank',
      metadata: {
        bloodType,
        location,
        requestId,
      }
    });

    return requestId;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

// ============================================
// Example 4: Real-time Notification Toast
// ============================================

import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { listenToUserNotifications } from './services/notificationService';
import { auth } from '../lib/firebase';

function NotificationToast() {
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    let previousCount = 0;

    const unsubscribe = listenToUserNotifications(
      currentUser.uid,
      (notifications) => {
        const currentCount = notifications.length;
        
        // New notification received
        if (currentCount > previousCount) {
          const latestNotification = notifications[0];
          
          // Show toast/alert for new notification
          Alert.alert(
            latestNotification.title,
            latestNotification.message,
            [
              { text: 'Dismiss', style: 'cancel' },
              { 
                text: 'View', 
                onPress: () => {
                  // Navigate to notifications screen
                  router.push('/notifications');
                }
              }
            ]
          );
        }
        
        previousCount = currentCount;
      }
    );

    return () => unsubscribe();
  }, []);

  return null; // This is a listener component, renders nothing
}

// ============================================
// Example 5: Notification Preferences Toggle
// ============================================

import React, { useState } from 'react';
import { View, Switch, Text } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

function NotificationSettings() {
  const [urgentEnabled, setUrgentEnabled] = useState(true);
  const [generalEnabled, setGeneralEnabled] = useState(true);
  const [eventsEnabled, setEventsEnabled] = useState(true);

  const updatePreferences = async (type: string, enabled: boolean) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`notificationPreferences.${type}`]: enabled,
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
        <Text>Urgent Notifications</Text>
        <Switch
          value={urgentEnabled}
          onValueChange={(value) => {
            setUrgentEnabled(value);
            updatePreferences('urgent', value);
          }}
        />
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
        <Text>General Notifications</Text>
        <Switch
          value={generalEnabled}
          onValueChange={(value) => {
            setGeneralEnabled(value);
            updatePreferences('general', value);
          }}
        />
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>Event Notifications</Text>
        <Switch
          value={eventsEnabled}
          onValueChange={(value) => {
            setEventsEnabled(value);
            updatePreferences('events', value);
          }}
        />
      </View>
    </View>
  );
}

// ============================================
// Example 6: Admin Dashboard Stats Widget
// ============================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listenToAdminNotifications } from './services/notificationService';

function AdminStatsWidget() {
  const [stats, setStats] = useState({
    totalSent: 0,
    totalRead: 0,
    readRate: 0,
  });

  useEffect(() => {
    const unsubscribe = listenToAdminNotifications((notifications) => {
      const totalSent = notifications.reduce((sum, n) => sum + n.totalSent, 0);
      const totalRead = notifications.reduce((sum, n) => sum + n.readCount, 0);
      const readRate = totalSent > 0 ? (totalRead / totalSent * 100).toFixed(1) : 0;

      setStats({ totalSent, totalRead, readRate: Number(readRate) });
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{stats.totalSent}</Text>
        <Text style={styles.statLabel}>Total Sent</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{stats.totalRead}</Text>
        <Text style={styles.statLabel}>Total Read</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{stats.readRate}%</Text>
        <Text style={styles.statLabel}>Read Rate</Text>
      </View>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

// ============================================
// Example 7: Scheduled Notification (Future Feature)
// ============================================

/**
 * Note: This requires Firebase Cloud Functions
 * Create a scheduled job that sends notifications at specific times
 */

// Cloud Function (functions/index.js)
/*
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.sendScheduledNotifications = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Get users who haven't donated in 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('lastDonationDate', '<', threeMonthsAgo)
      .where('role', '==', 'donor')
      .get();

    // Send reminder notification
    const batch = admin.firestore().batch();
    
    usersSnapshot.docs.forEach(doc => {
      const notificationRef = admin.firestore()
        .collection('userNotifications')
        .doc();
      
      batch.set(notificationRef, {
        userId: doc.id,
        title: 'Ready to Donate Again?',
        message: "It's been 3 months since your last donation. You're eligible to save lives again!",
        type: 'reminder',
        read: false,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`Sent ${usersSnapshot.size} reminder notifications`);
  });
*/

// ============================================
// USAGE NOTES:
// ============================================
/*
1. Copy the example you need
2. Import required dependencies
3. Adjust styling to match your app theme
4. Test with real data
5. Add error handling as needed

All examples use the notification service created in:
- app/services/notificationService.ts

Make sure Firebase is properly configured before using these examples.
*/

export {};
