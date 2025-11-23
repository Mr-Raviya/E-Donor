# Push Notifications Setup Guide (Optional Enhancement)

This guide shows how to add **push notifications** to your E-Donor app so users receive notifications even when the app is closed or in the background.

## 📝 What's the Difference?

- **Real-time Firestore notifications** (already implemented) - Work only when app is open
- **Push notifications** (this guide) - Work even when app is closed

## 🎯 Prerequisites

1. Expo account (free)
2. Physical device for testing (push notifications don't work on simulators)
3. Already have real-time notifications working (from previous setup)

## 📦 Installation

### Step 1: Install Required Packages

```bash
npm install expo-notifications expo-device
```

Or if you use yarn:

```bash
yarn add expo-notifications expo-device
```

### Step 2: Update app.json

Add the following to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#DC143C",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#DC143C",
      "iosDisplayInForeground": true,
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} new notifications"
    }
  }
}
```

### Step 3: Add Notification Icon (Android)

Create a notification icon:
- Size: 96x96 pixels
- Background: Transparent
- Color: White silhouette
- Save as: `assets/notification-icon.png`

## 🔧 Implementation

### Step 1: Setup in App Root

In your main app file (e.g., `app/_layout.tsx`), add push notification initialization:

```typescript
import { usePushNotifications } from '../hooks/use-push-notifications';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();

  // Initialize push notifications
  const { pushToken, badgeCount, updateBadgeCount } = usePushNotifications({
    onNotificationReceived: (notification) => {
      console.log('📬 Notification received:', notification.request.content.title);
      // Optionally show a local alert or toast
    },
    onNotificationTapped: (response) => {
      console.log('👆 Notification tapped');
      
      // Navigate based on notification data
      const data = response.notification.request.content.data;
      
      if (data.screen === 'requests') {
        router.push('/request-detail');
      } else if (data.screen === 'chat') {
        router.push('/chat');
      }
      // Add more navigation logic as needed
    }
  });

  // Update badge count when notifications change
  useEffect(() => {
    // Sync badge count with unread notifications
    const syncBadgeCount = async () => {
      const unreadCount = await getUnreadNotificationCount(auth.currentUser?.uid);
      updateBadgeCount(unreadCount);
    };
    
    syncBadgeCount();
  }, []);

  return (
    // Your app layout
  );
}
```

### Step 2: Update User Profile with Push Token

When user logs in, save their push token:

```typescript
import { registerForPushNotifications, savePushToken } from './services/pushNotificationService';
import { auth } from '../lib/firebase';

// After successful login
const token = await registerForPushNotifications();
if (token && auth.currentUser) {
  await savePushToken(auth.currentUser.uid, token);
}
```

### Step 3: Update Firestore User Document

Ensure user documents have a `pushToken` field:

```javascript
// In Firestore 'users' collection:
{
  id: "user-id",
  name: "User Name",
  email: "user@example.com",
  role: "donor",
  pushToken: "ExponentPushToken[xxxxxxxxxxxxxx]",  // Added automatically
  pushTokenUpdatedAt: Timestamp
}
```

## 🔥 Backend: Sending Push Notifications

### Option 1: Using Firebase Cloud Functions (Recommended)

Create a Cloud Function that sends push notifications when admin creates notification:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

exports.sendPushNotification = functions.firestore
  .document('userNotifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const userId = notification.userId;

    // Get user's push token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const pushToken = userDoc.data()?.pushToken;

    if (!pushToken) {
      console.log('No push token for user:', userId);
      return;
    }

    // Send push notification via Expo Push API
    const message = {
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: { 
        notificationId: context.params.notificationId,
        type: notification.type 
      },
      priority: 'high',
      channelId: 'default',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  });
```

### Option 2: Direct API Call from Admin App

Update `notificationService.ts` to send push notifications:

```typescript
// Add to notificationService.ts

const sendPushNotificationToUser = async (pushToken: string, notification: NotificationData) => {
  const message = {
    to: pushToken,
    sound: 'default',
    title: notification.title,
    body: notification.message,
    data: { 
      type: notification.type,
      metadata: notification.metadata 
    },
    priority: 'high',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

// Modify sendNotification function to send push notifications
export const sendNotification = async (
  notificationData: Omit<NotificationData, 'id' | 'sentDate' | 'readBy'>
): Promise<string> => {
  // ... existing code ...

  // After creating user notifications, send push notifications
  const userDocs = await getDocs(query(collection(db, 'users'), where('role', '==', notificationData.targetAudience)));
  
  const pushPromises = userDocs.docs.map(async (doc) => {
    const pushToken = doc.data().pushToken;
    if (pushToken) {
      await sendPushNotificationToUser(pushToken, notification);
    }
  });

  await Promise.all(pushPromises);

  return docRef.id;
};
```

## 🧪 Testing Push Notifications

### Test on Physical Device:

1. **Build and install app:**
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

2. **Send test notification:**
   - Open admin dashboard
   - Send a notification
   - Close the app completely
   - Notification should appear in system tray

3. **Test notification tap:**
   - Tap on notification
   - App should open to correct screen

### Test with Expo Push Tool:

Visit: https://expo.dev/notifications

Fill in:
- **Push Token**: Your device's ExponentPushToken
- **Title**: "Test Notification"
- **Body**: "This is a test"
- Click "Send"

## 📱 Platform-Specific Setup

### iOS (Apple Push Notification Service - APNS):

1. **Apple Developer Account Required** (paid)
2. Generate APNs key in Apple Developer Console
3. Add to `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### Android (Firebase Cloud Messaging - FCM):

1. **No extra setup needed** - works automatically with Expo
2. For custom setup, add `google-services.json` (you already have this)

## 🎨 Customize Notification Appearance

### Android:

```typescript
import * as Notifications from 'expo-notifications';

await Notifications.setNotificationChannelAsync('urgent', {
  name: 'Urgent Notifications',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#DC143C',
  sound: 'urgent.wav',
});
```

### iOS:

iOS uses system default styling, but you can customize:
- Badge number
- Sound
- Alert style

## 🔔 Badge Count Management

### Update badge when receiving notification:

```typescript
import { setBadgeCount } from './services/pushNotificationService';
import { getUnreadNotificationCount } from './services/notificationService';

// In your notification listener
const updateBadge = async () => {
  const unreadCount = await getUnreadNotificationCount(userId);
  await setBadgeCount(unreadCount);
};
```

### Clear badge when user opens notifications:

```typescript
// In notifications.tsx
useEffect(() => {
  // Clear badge when user opens notification screen
  setBadgeCount(0);
}, []);
```

## ⚙️ Advanced Features

### Rich Notifications (iOS):

```typescript
const notification = {
  content: {
    title: 'Blood Request',
    body: 'O- blood urgently needed',
    data: { requestId: '123' },
    attachments: [
      {
        url: 'https://example.com/image.png',
      }
    ],
  },
  trigger: null,
};
```

### Notification Actions:

```typescript
await Notifications.setNotificationCategoryAsync('bloodRequest', [
  {
    identifier: 'accept',
    buttonTitle: 'Accept',
    options: {
      opensAppToForeground: true,
    },
  },
  {
    identifier: 'decline',
    buttonTitle: 'Decline',
    options: {
      opensAppToForeground: false,
    },
  },
]);
```

## 🚨 Troubleshooting

### "Push notifications don't work on simulator"
- **Solution**: Test on physical device only

### "Token is null"
- **Check**: Device permissions granted
- **Check**: Running on physical device
- **Check**: Internet connection active

### "Notifications not received when app is closed"
- **Check**: Firebase Cloud Functions deployed
- **Check**: User has valid push token in Firestore
- **Check**: Expo Push API credentials configured

### "Badge count not updating"
- **Check**: Calling setBadgeCount after updates
- **Check**: iOS/Android permissions

## 📊 Best Practices

1. **Request permissions at appropriate time** - Not immediately on app launch
2. **Handle permission denial gracefully** - Offer alternative (email notifications)
3. **Update push tokens regularly** - Tokens can expire
4. **Don't spam users** - Respect notification preferences
5. **Test on real devices** - Simulators don't support push notifications
6. **Use notification categories** - Group similar notifications
7. **Implement opt-out** - Allow users to disable push notifications

## 🔐 Privacy & Security

- Store push tokens securely in Firestore
- Validate notifications server-side
- Use HTTPS for all API calls
- Implement rate limiting
- Don't send sensitive data in notifications
- Allow users to manage notification preferences

## ✅ Checklist

- [ ] expo-notifications installed
- [ ] expo-device installed
- [ ] Notification icon created
- [ ] app.json configured
- [ ] Push notification hook integrated
- [ ] User push tokens saved to Firestore
- [ ] Firebase Cloud Functions deployed (if using)
- [ ] Tested on physical device
- [ ] Badge count updates correctly
- [ ] Notification tap navigation works
- [ ] Permissions handled gracefully

## 🎉 You're Done!

Your app now supports push notifications! Users will receive notifications even when the app is closed.

**Note**: Push notifications are optional but highly recommended for better user engagement. The real-time Firestore system works great when users have the app open.
