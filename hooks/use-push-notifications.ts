// @ts-nocheck
// This file requires expo-notifications package to be installed
// Run: npm install expo-notifications expo-device
// For now, this file is disabled to prevent app crashes

/*
import { useEffect, useState } from 'react';
import { registerForPushNotifications, savePushToken, setupNotificationListeners, getBadgeCount, setBadgeCount } from '../services/pushNotificationService';
import { auth } from '../../lib/firebase';
import * as Notifications from 'expo-notifications';
*/

/**
 * Custom hook for managing push notifications
 * 
 * Usage in App component or main screen:
 * ```
 * const { pushToken, badgeCount, refreshBadgeCount } = usePushNotifications({
 *   onNotificationReceived: (notification) => {
 *     console.log('New notification:', notification);
 *   },
 *   onNotificationTapped: (response) => {
 *     // Navigate to specific screen based on notification data
 *     const { screen } = response.notification.request.content.data;
 *     if (screen) {
 *       router.push(screen);
 *     }
 *   }
 * });
 * ```
 */
export function usePushNotifications(options?: {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
}) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [badgeCount, setBadgeCountState] = useState<number>(0);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      try {
        // Register for push notifications
        const token = await registerForPushNotifications();
        
        if (token) {
          setPushToken(token);

          // Save token to Firestore if user is logged in
          const currentUser = auth.currentUser;
          if (currentUser) {
            await savePushToken(currentUser.uid, token);
          }
        }

        // Setup notification listeners
        cleanup = setupNotificationListeners(
          options?.onNotificationReceived,
          options?.onNotificationTapped
        );

        // Get initial badge count
        const count = await getBadgeCount();
        setBadgeCountState(count);
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const refreshBadgeCount = async () => {
    const count = await getBadgeCount();
    setBadgeCountState(count);
  };

  const updateBadgeCount = async (count: number) => {
    await setBadgeCount(count);
    setBadgeCountState(count);
  };

  return {
    pushToken,
    badgeCount,
    refreshBadgeCount,
    updateBadgeCount,
  };
}
