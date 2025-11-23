import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

export type NotificationType = 'critical' | 'urgent' | 'info' | 'success' | 'general' | 'reminder' | 'event';
export type TargetAudience = 'all' | 'donors' | 'recipients' | 'specific';

export interface NotificationData {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  targetAudience: TargetAudience;
  targetUserIds?: string[]; // For specific user targeting
  sentBy: string; // Admin ID or name
  sentDate: Timestamp | Date;
  readBy?: string[]; // Array of user IDs who have read the notification
  metadata?: {
    bloodType?: string;
    location?: string;
    eventDate?: string;
    requestId?: string;
    [key: string]: any;
  };
}

export interface UserNotification extends NotificationData {
  id: string;
  read: boolean;
  receivedAt: Timestamp;
}

const NOTIFICATIONS_COLLECTION = 'notifications';
const USER_NOTIFICATIONS_COLLECTION = 'userNotifications';

/**
 * Admin sends a notification to users in real-time
 */
export const sendNotification = async (
  notificationData: Omit<NotificationData, 'id' | 'sentDate' | 'readBy'>
): Promise<string> => {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('❌ User not authenticated. Please log in first.');
    }
    
    console.log('📤 Sending notification:', notificationData.title);
    console.log('👤 Current user:', currentUser.email, '| UID:', currentUser.uid);
    
    // Check if user is admin
    try {
      const adminDocRef = doc(db, 'admins', currentUser.uid);
      const adminDoc = await getDoc(adminDocRef);
      
      if (!adminDoc.exists()) {
        console.error('❌ User is not an admin. UID:', currentUser.uid);
        throw new Error('Access denied: User is not an admin. Please add your UID to the admins collection in Firestore.');
      }
      
      console.log('✅ Admin verified:', adminDoc.data());
    } catch (adminError: any) {
      console.error('❌ Admin verification failed:', adminError);
      throw new Error(`Admin verification failed: ${adminError.message}`);
    }
    
    const notification: Omit<NotificationData, 'id'> = {
      ...notificationData,
      sentDate: serverTimestamp() as Timestamp,
      readBy: [],
    };

    // Add to main notifications collection
    console.log('📝 Creating notification document...');
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
    console.log(`✅ Notification document created with ID: ${docRef.id}`);

    // If targeting specific users or all/donors/recipients, create individual user notifications
    if (notificationData.targetAudience === 'specific' && notificationData.targetUserIds) {
      // Send to specific users
      console.log(`📤 Sending to ${notificationData.targetUserIds.length} specific users`);
      await createUserNotifications(docRef.id, notification, notificationData.targetUserIds);
    } else {
      // For 'all', 'donors', 'recipients' - create notifications for matching users
      // This requires querying users based on their role/type
      const targetUserIds = await getTargetUserIds(notificationData.targetAudience);
      
      if (targetUserIds.length === 0) {
        console.warn(`⚠️ No target users found for audience: ${notificationData.targetAudience}`);
        console.warn('⚠️ Notification created but not sent to any users. Create user documents in Firestore.');
      } else {
        await createUserNotifications(docRef.id, notification, targetUserIds);
      }
    }

    console.log('✅ Notification sent successfully!');
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    throw error;
  }
};

/**
 * Create individual notification documents for each target user
 */
const createUserNotifications = async (
  notificationId: string,
  notification: Omit<NotificationData, 'id'>,
  userIds: string[]
): Promise<void> => {
  try {
    const batch: Promise<any>[] = [];

    for (const userId of userIds) {
      const userNotification = {
        notificationId,
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        sentBy: notification.sentBy,
        read: false,
        receivedAt: serverTimestamp(),
        metadata: notification.metadata || {},
      };

      batch.push(addDoc(collection(db, USER_NOTIFICATIONS_COLLECTION), userNotification));
    }

    await Promise.all(batch);
    console.log(`Created ${userIds.length} user notifications`);
  } catch (error) {
    console.error('Error creating user notifications:', error);
    throw error;
  }
};

/**
 * Get user IDs based on target audience
 */
const getTargetUserIds = async (targetAudience: TargetAudience): Promise<string[]> => {
  try {
    console.log(`🔍 Getting target user IDs for audience: ${targetAudience}`);
    
    if (targetAudience === 'all') {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userIds = usersSnapshot.docs.map((doc) => doc.id);
      console.log(`✅ Found ${userIds.length} users for 'all' audience`);
      
      if (userIds.length === 0) {
        console.warn('⚠️ No users found in users collection! Please create user documents.');
      }
      
      return userIds;
    } else if (targetAudience === 'donors') {
      // Get users with role 'donor'
      const q = query(collection(db, 'users'), where('role', '==', 'donor'));
      const snapshot = await getDocs(q);
      const userIds = snapshot.docs.map((doc) => doc.id);
      console.log(`✅ Found ${userIds.length} donors`);
      
      if (userIds.length === 0) {
        console.warn('⚠️ No donors found! Make sure users have role="donor"');
      }
      
      return userIds;
    } else if (targetAudience === 'recipients') {
      // Get users with role 'recipient'
      const q = query(collection(db, 'users'), where('role', '==', 'recipient'));
      const snapshot = await getDocs(q);
      const userIds = snapshot.docs.map((doc) => doc.id);
      console.log(`✅ Found ${userIds.length} recipients`);
      
      if (userIds.length === 0) {
        console.warn('⚠️ No recipients found! Make sure users have role="recipient"');
      }
      
      return userIds;
    }
    return [];
  } catch (error) {
    console.error('❌ Error getting target user IDs:', error);
    return [];
  }
};

/**
 * Real-time listener for user notifications
 * This function sets up a live listener that receives notifications instantly
 */
export const listenToUserNotifications = (
  userId: string,
  onNotificationsUpdate: (notifications: UserNotification[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const q = query(
      collection(db, USER_NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: UserNotification[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            notificationId: data.notificationId,
            title: data.title,
            message: data.message,
            type: data.type as NotificationType,
            targetAudience: 'all', // This is at user level now
            sentBy: data.sentBy,
            sentDate: data.receivedAt,
            read: data.read || false,
            receivedAt: data.receivedAt,
            metadata: data.metadata || {},
          } as UserNotification;
        });

        onNotificationsUpdate(notifications);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        if (onError) {
          onError(error);
        }
      }
    );

    // Return unsubscribe function to stop listening
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, USER_NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });

    console.log('Notification marked as read:', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, USER_NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch: Promise<any>[] = [];

    snapshot.docs.forEach((document) => {
      batch.push(
        updateDoc(doc(db, USER_NOTIFICATIONS_COLLECTION, document.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      );
    });

    await Promise.all(batch);
    console.log(`Marked ${batch.length} notifications as read`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, USER_NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Admin: Get all sent notifications with stats
 */
export const getAdminNotifications = async (): Promise<any[]> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('sentDate', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const notifications = await Promise.all(
      snapshot.docs.map(async (document) => {
        const data = document.data();

        // Get stats for this notification
        const statsQuery = query(
          collection(db, USER_NOTIFICATIONS_COLLECTION),
          where('notificationId', '==', document.id)
        );
        const statsSnapshot = await getDocs(statsQuery);

        const totalSent = statsSnapshot.size;
        const readCount = statsSnapshot.docs.filter((doc) => doc.data().read === true).length;

        return {
          id: document.id,
          ...data,
          totalSent,
          readCount,
        };
      })
    );

    return notifications;
  } catch (error) {
    console.error('Error getting admin notifications:', error);
    return [];
  }
};

/**
 * Real-time listener for admin notifications dashboard
 */
export const listenToAdminNotifications = (
  onNotificationsUpdate: (notifications: any[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('sentDate', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const notifications = await Promise.all(
          snapshot.docs.map(async (document) => {
            const data = document.data();

            // Get stats
            const statsQuery = query(
              collection(db, USER_NOTIFICATIONS_COLLECTION),
              where('notificationId', '==', document.id)
            );
            const statsSnapshot = await getDocs(statsQuery);

            const totalSent = statsSnapshot.size;
            const readCount = statsSnapshot.docs.filter((doc) => doc.data().read === true).length;

            return {
              id: document.id,
              title: data.title,
              message: data.message,
              type: data.type,
              targetAudience: data.targetAudience,
              sentDate: data.sentDate?.toDate?.()?.toISOString?.()?.split('T')[0] || 'N/A',
              sentBy: data.sentBy,
              totalSent,
              readCount,
            };
          })
        );

        onNotificationsUpdate(notifications);
      },
      (error) => {
        console.error('Error listening to admin notifications:', error);
        if (onError) {
          onError(error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up admin notification listener:', error);
    throw error;
  }
};
