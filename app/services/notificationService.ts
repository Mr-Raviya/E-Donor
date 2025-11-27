import {
  addDoc,
  collection,
  deleteDoc,
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
  where
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
      // Get all users from profiles collection
      const profilesSnapshot = await getDocs(collection(db, 'profiles'));
      const userIds = profilesSnapshot.docs.map((doc) => doc.id);
      console.log(`✅ Found ${userIds.length} users for 'all' audience from profiles`);
      
      // Also check users collection as fallback
      if (userIds.length === 0) {
        console.log('🔍 No profiles found, checking users collection...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const fallbackIds = usersSnapshot.docs.map((doc) => doc.id);
        console.log(`✅ Found ${fallbackIds.length} users from users collection`);
        return fallbackIds;
      }
      
      return userIds;
    } else if (targetAudience === 'donors') {
      // Get users with role 'donor' - check profiles first, then users
      let userIds: string[] = [];
      
      // Try profiles collection
      const profilesSnapshot = await getDocs(collection(db, 'profiles'));
      userIds = profilesSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.role === 'donor' || data.user_type === 'donor' || !data.role; // Default to donor if no role
        })
        .map((doc) => doc.id);
      
      if (userIds.length === 0) {
        // Fallback to users collection
        const q = query(collection(db, 'users'), where('role', '==', 'donor'));
        const snapshot = await getDocs(q);
        userIds = snapshot.docs.map((doc) => doc.id);
      }
      
      console.log(`✅ Found ${userIds.length} donors`);
      return userIds;
    } else if (targetAudience === 'recipients') {
      // Get users with role 'recipient'
      let userIds: string[] = [];
      
      // Try profiles collection
      const profilesSnapshot = await getDocs(collection(db, 'profiles'));
      userIds = profilesSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.role === 'recipient' || data.user_type === 'recipient';
        })
        .map((doc) => doc.id);
      
      if (userIds.length === 0) {
        // Fallback to users collection
        const q = query(collection(db, 'users'), where('role', '==', 'recipient'));
        const snapshot = await getDocs(q);
        userIds = snapshot.docs.map((doc) => doc.id);
      }
      
      console.log(`✅ Found ${userIds.length} recipients`);
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
 * Filters out notifications that have been deleted by the user
 */
export const listenToUserNotifications = (
  userId: string,
  onNotificationsUpdate: (notifications: UserNotification[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    console.log(`🔔 Setting up notifications listener for user: ${userId}`);
    
    // Simple query - just filter by userId, sort in memory
    const q = query(
      collection(db, USER_NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`📬 User ${userId}: Received ${snapshot.docs.length} notifications`);
        
        const notifications: UserNotification[] = snapshot.docs
          .filter((doc) => {
            const data = doc.data();
            // Filter out deleted notifications
            return data.deleted !== true;
          })
          .map((doc) => {
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
          })
          // Sort by receivedAt descending (newest first)
          .sort((a, b) => {
            const timeA = a.receivedAt?.toDate?.()?.getTime?.() || 0;
            const timeB = b.receivedAt?.toDate?.()?.getTime?.() || 0;
            return timeB - timeA;
          })
          .slice(0, 50); // Limit to 50

        onNotificationsUpdate(notifications);
      },
      (error) => {
        console.error('❌ Error listening to notifications:', error);
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
 * Delete a single notification for a user (marks as deleted, only affects this user)
 */
export const deleteUserNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, USER_NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
    });

    console.log('Notification deleted for user:', notificationId);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Admin: Delete a notification - handles both admin notifications and userNotifications
 * Since admin dashboard now shows notifications from userNotifications,
 * the ID could be either a notificationId (from notifications collection)
 * or a document ID from userNotifications
 */
export const deleteAdminNotification = async (notificationId: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting notification: ${notificationId}`);
    
    // First, try to find all userNotifications with this notificationId
    const relatedByNotificationIdQuery = query(
      collection(db, USER_NOTIFICATIONS_COLLECTION),
      where('notificationId', '==', notificationId)
    );
    const relatedByNotificationId = await getDocs(relatedByNotificationIdQuery);
    
    let deletedCount = 0;
    const updates: Promise<any>[] = [];

    if (relatedByNotificationId.size > 0) {
      // Found related notifications - mark them all as deleted
      console.log(`📋 Found ${relatedByNotificationId.size} related user notifications`);
      relatedByNotificationId.forEach((document) => {
        updates.push(
          updateDoc(doc(db, USER_NOTIFICATIONS_COLLECTION, document.id), {
            deleted: true,
            deletedAt: serverTimestamp(),
          })
        );
      });
      deletedCount = relatedByNotificationId.size;
    } else {
      // No related notifications found by notificationId
      // The ID might be a direct document ID from userNotifications
      // Try to delete/mark as deleted directly
      console.log(`📋 No related notifications found, trying direct document ID`);
      
      try {
        const directDocRef = doc(db, USER_NOTIFICATIONS_COLLECTION, notificationId);
        const directDoc = await getDoc(directDocRef);
        
        if (directDoc.exists()) {
          updates.push(
            updateDoc(directDocRef, {
              deleted: true,
              deletedAt: serverTimestamp(),
            })
          );
          deletedCount = 1;
          
          // Also delete any other notifications with same title/message (grouped notifications)
          const docData = directDoc.data();
          if (docData.title && docData.message) {
            const similarQuery = query(collection(db, USER_NOTIFICATIONS_COLLECTION));
            const allDocs = await getDocs(similarQuery);
            
            allDocs.forEach((otherDoc) => {
              if (otherDoc.id !== notificationId) {
                const otherData = otherDoc.data();
                if (otherData.title === docData.title && 
                    otherData.message === docData.message &&
                    otherData.deleted !== true) {
                  updates.push(
                    updateDoc(doc(db, USER_NOTIFICATIONS_COLLECTION, otherDoc.id), {
                      deleted: true,
                      deletedAt: serverTimestamp(),
                    })
                  );
                  deletedCount++;
                }
              }
            });
          }
        }
      } catch (directError) {
        console.warn('Could not find direct document:', directError);
      }
    }

    // Also try to delete from the main notifications collection
    try {
      const mainNotificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      const mainDoc = await getDoc(mainNotificationRef);
      if (mainDoc.exists()) {
        await deleteDoc(mainNotificationRef);
        console.log(`🗑️ Deleted from main notifications collection`);
      }
    } catch (mainError) {
      // It's okay if this fails - notification might not exist in main collection
      console.log('Notification not found in main collection (this is okay)');
    }

    await Promise.all(updates);
    console.log(`✅ Successfully deleted/marked ${deletedCount} notifications as deleted`);
  } catch (error) {
    console.error('❌ Error deleting admin notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications for a user (marks all as deleted, only affects this user)
 */
export const clearAllUserNotifications = async (userId: string): Promise<void> => {
  try {
    // Simple query with single where clause to avoid index requirement
    const q = query(
      collection(db, USER_NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const batch: Promise<any>[] = [];

    // Filter out already deleted notifications in code
    snapshot.docs.forEach((document) => {
      const data = document.data();
      if (data.deleted !== true) {
        batch.push(
          updateDoc(doc(db, USER_NOTIFICATIONS_COLLECTION, document.id), {
            deleted: true,
            deletedAt: serverTimestamp(),
          })
        );
      }
    });

    await Promise.all(batch);
    console.log(`Cleared ${batch.length} notifications for user`);
  } catch (error) {
    console.error('Error clearing all notifications:', error);
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
 * Shows all notifications - both from admin panel and from userNotifications
 */
export const listenToAdminNotifications = (
  onNotificationsUpdate: (notifications: any[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    console.log('🔔 Setting up admin notifications listener...');
    
    // Listen to userNotifications collection to get all notifications including hospital messages
    const userNotificationsRef = collection(db, USER_NOTIFICATIONS_COLLECTION);

    const unsubscribe = onSnapshot(
      userNotificationsRef,
      async (snapshot) => {
        console.log(`📬 Received ${snapshot.docs.length} user notifications from Firestore`);
        
        if (snapshot.docs.length === 0) {
          console.log('ℹ️ No notifications found in userNotifications collection');
          onNotificationsUpdate([]);
          return;
        }
        
        try {
          // Group notifications by notificationId or by title+message (for unique identification)
          const notificationMap = new Map<string, {
            id: string;
            title: string;
            message: string;
            type: string;
            targetAudience: string;
            sentDate: string;
            sentBy: string;
            totalSent: number;
            readCount: number;
            _timestamp: number;
          }>();

          for (const document of snapshot.docs) {
            const data = document.data();
            
            // Skip deleted notifications
            if (data.deleted === true) continue;
            
            // Use notificationId if available, otherwise create a unique key
            const groupKey = data.notificationId || `${data.title}_${data.message}`.substring(0, 100);
            
            // Handle different date formats
            let sentDateStr = 'N/A';
            let sentDateTimestamp = 0;
            const dateField = data.receivedAt || data.sentDate || data.createdAt;
            
            if (dateField) {
              if (dateField.toDate) {
                const date = dateField.toDate();
                sentDateStr = date.toISOString().split('T')[0];
                sentDateTimestamp = date.getTime();
              } else if (dateField instanceof Date) {
                sentDateStr = dateField.toISOString().split('T')[0];
                sentDateTimestamp = dateField.getTime();
              } else if (typeof dateField === 'string') {
                sentDateStr = dateField.split('T')[0];
                sentDateTimestamp = new Date(dateField).getTime();
              }
            }

            if (notificationMap.has(groupKey)) {
              // Update existing entry - increment counts
              const existing = notificationMap.get(groupKey)!;
              existing.totalSent += 1;
              if (data.read === true) {
                existing.readCount += 1;
              }
              // Keep the latest timestamp
              if (sentDateTimestamp > existing._timestamp) {
                existing._timestamp = sentDateTimestamp;
                existing.sentDate = sentDateStr;
              }
            } else {
              // Create new entry
              notificationMap.set(groupKey, {
                id: data.notificationId || document.id,
                title: data.title || 'Untitled',
                message: data.message || '',
                type: data.type || 'general',
                targetAudience: data.targetAudience || 'all',
                sentDate: sentDateStr,
                sentBy: data.sentBy || 'System',
                totalSent: 1,
                readCount: data.read === true ? 1 : 0,
                _timestamp: sentDateTimestamp,
              });
            }
          }

          // Convert map to array and sort by date descending
          const notifications = Array.from(notificationMap.values())
            .sort((a, b) => b._timestamp - a._timestamp)
            .slice(0, 50)
            .map(({ _timestamp, ...rest }) => rest); // Remove the temp sorting field

          console.log(`✅ Processed ${notifications.length} unique notifications successfully`);
          onNotificationsUpdate(notifications);
        } catch (processingError) {
          console.error('❌ Error processing notifications:', processingError);
          if (onError) {
            onError(processingError as Error);
          }
        }
      },
      (error) => {
        console.error('❌ Error listening to admin notifications:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (onError) {
          onError(error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up admin notification listener:', error);
    if (onError) {
      onError(error as Error);
    }
    // Return a no-op function if setup fails
    return () => {};
  }
};

// Added to silence Expo Router route warnings; this file is not a screen.
export default {};
