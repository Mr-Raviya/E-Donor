# Firebase Real-Time Notifications Setup Guide

This guide explains how the real-time notification system works in the E-Donor app and how to set it up properly.

## 🎯 Overview

The notification system uses **Firebase Firestore** with real-time listeners to instantly deliver notifications from admins to users. When an admin sends a notification, it's immediately received by all target users in real-time without any delay.

## 📁 Architecture

### Collections Structure in Firebase:

1. **`notifications`** - Stores all notifications sent by admins
   - Contains: title, message, type, targetAudience, sentBy, sentDate, metadata
   - Used for admin dashboard statistics

2. **`userNotifications`** - Individual notification documents for each user
   - Contains: notificationId, userId, title, message, type, read status, receivedAt
   - Used for real-time delivery to users

3. **`users`** - User profiles with roles
   - Required fields: role (donor/recipient)
   - Used to target specific user groups

## 🚀 How It Works

### Admin Sends Notification:

1. Admin fills out notification form in `admin-notifications.tsx`
2. Clicks "Send Notification" button
3. `sendNotification()` function creates:
   - One document in `notifications` collection
   - Multiple documents in `userNotifications` (one per target user)
4. Real-time listeners on user devices receive the notification instantly

### User Receives Notification:

1. User's device has an active listener via `listenToUserNotifications()`
2. When admin sends notification, Firestore triggers the listener
3. Notification appears instantly in the user's notification list
4. User can mark notifications as read

## 📝 Firebase Setup

### Step 1: Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Create the following indexes:

**Option A: Automatic Index Creation (Recommended)**

Firebase will automatically detect when you need an index. Just run your app and:

1. Open the notifications screen as a user
2. Check browser console for any errors
3. If you see an error like "The query requires an index", it will include a **direct link**
4. Click the link → Firebase will create the index automatically
5. Wait 5-10 minutes for the index to build

**Option B: Manual Index Creation**

Create these indexes manually in Firebase Console → Firestore Database → Indexes:

**Index 1: userNotifications by userId and receivedAt** (REQUIRED)
```
Collection: userNotifications
Fields:
  - userId (Ascending)
  - receivedAt (Descending)
```

**Index 2: userNotifications by userId and read** (REQUIRED)
```
Collection: userNotifications
Fields:
  - userId (Ascending)
  - read (Ascending)
```

**Note**: Only Index 1 and Index 2 are required. Firebase will automatically prompt you to create these indexes when you first use the app. You can also create them manually in the Firebase Console → Firestore Database → Indexes tab.

### Step 2: Firestore Security Rules

Add these rules to your Firestore to secure your notifications:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Notifications - Only admins can write
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // User Notifications - Users can only read their own
    match /userNotifications/{notificationId} {
      allow read: if request.auth != null && 
                    resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                     resource.data.userId == request.auth.uid &&
                     request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['read', 'readAt']);
      allow create: if request.auth != null && 
                     exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins collection
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

### Step 3: Create Admin Users

Add admin documents to the `admins` collection:

```javascript
// In Firestore Console, create a document in 'admins' collection:
{
  id: "your-admin-user-id",
  name: "Admin Name",
  email: "admin@example.com",
  role: "admin"
}
```

### Step 4: User Role Setup

Ensure all users have a `role` field in their documents:

```javascript
// In 'users' collection:
{
  id: "user-id",
  name: "User Name",
  email: "user@example.com",
  role: "donor" // or "recipient"
}
```

## 🔧 Code Integration

### Files Created/Modified:

1. **`app/services/notificationService.ts`** (NEW)
   - Core notification logic
   - Real-time listeners
   - CRUD operations

2. **`app/admin-notifications.tsx`** (UPDATED)
   - Uses `sendNotification()` to send notifications
   - Real-time admin dashboard with `listenToAdminNotifications()`
   - Shows delivery statistics

3. **`app/notifications.tsx`** (UPDATED)
   - Uses `listenToUserNotifications()` for real-time updates
   - Auto-refreshes when new notifications arrive
   - Mark as read functionality

## 📱 Testing the System

### Test as Admin:

1. Open admin dashboard (`/admin-notifications`)
2. Click "Send Notification" button
3. Fill in:
   - Title: "Test Notification"
   - Message: "This is a test"
   - Type: "info"
   - Target: "all"
4. Click "Send Notification"
5. Check the notification appears in the history immediately

### Test as User:

1. Open user notifications screen (`/notifications`)
2. Keep the screen open
3. From another device/browser, send a notification as admin
4. **The notification should appear instantly** without refreshing
5. Click on notification to mark as read

## 🎨 Notification Types

The system supports different notification types:

- **critical** - Red badge, high priority
- **urgent** - Orange badge, medium priority
- **info** / **general** - Blue badge, normal priority
- **success** - Green badge, positive messages
- **reminder** - Yellow badge, reminders
- **event** - Blue badge, event announcements

## 🎯 Target Audiences

You can send notifications to:

- **all** - All registered users
- **donors** - Only users with role="donor"
- **recipients** - Only users with role="recipient"
- **specific** - Specific user IDs (requires targetUserIds array)

## 🔔 Features Implemented

✅ Real-time notification delivery (no refresh needed)
✅ Admin dashboard with send notification form
✅ Notification templates for quick sending
✅ Target audience selection
✅ Notification type categorization
✅ Read/Unread status tracking
✅ Mark all as read functionality
✅ Delivery statistics (total sent, read count)
✅ Real-time listener cleanup on unmount
✅ Error handling and loading states
✅ Optimized queries with Firestore indexes

## 🚨 Troubleshooting

### Notifications Not Appearing:

1. **Check Firebase connection:**
   ```javascript
   // In console, verify auth is working
   import { auth } from '../lib/firebase';
   console.log('User:', auth.currentUser);
   ```

2. **Verify user has proper role:**
   - Check Firestore console
   - Ensure user document has `role` field

3. **Check Firestore rules:**
   - Open Firestore Rules tab
   - Verify rules allow read/write access

4. **Check indexes:**
   - Go to Firestore Indexes
   - Ensure all required indexes are created (can take 5-10 minutes)
   - If you see an error in console about missing index, Firebase will provide a direct link to create it

### Real-time Not Working:

1. **Listener not attached:**
   - Ensure `useEffect` is running
   - Check console for errors

2. **Auth state issue:**
   - Verify user is logged in
   - Check `auth.currentUser` is not null

3. **Network connectivity:**
   - Check internet connection
   - Firebase requires active connection for real-time updates

## 📊 Performance Optimization

The system uses several optimizations:

1. **Query Limits** - Only loads last 50 notifications
2. **Indexed Queries** - Fast lookups with compound indexes
3. **Batch Operations** - Multiple writes in parallel
4. **Listener Cleanup** - Unsubscribes on component unmount
5. **Serverless Architecture** - No backend needed

## 🔮 Future Enhancements

Potential features to add:

- Push notifications (using Firebase Cloud Messaging)
- Notification scheduling
- Rich media notifications (images, links)
- Notification preferences/settings
- Sound alerts
- Badge counts on app icon
- Email notifications backup
- Notification categories/filters

## 📚 API Reference

### Core Functions:

```typescript
// Send notification (Admin only)
sendNotification(data: NotificationData): Promise<string>

// Listen to user notifications (Real-time)
listenToUserNotifications(
  userId: string,
  onUpdate: (notifications: UserNotification[]) => void,
  onError?: (error: Error) => void
): () => void // Returns unsubscribe function

// Mark as read
markNotificationAsRead(notificationId: string, userId: string): Promise<void>

// Mark all as read
markAllNotificationsAsRead(userId: string): Promise<void>

// Get unread count
getUnreadNotificationCount(userId: string): Promise<number>

// Admin: Listen to all notifications
listenToAdminNotifications(
  onUpdate: (notifications: any[]) => void,
  onError?: (error: Error) => void
): () => void
```

## ✅ Checklist

Before going live, ensure:

- [ ] Firebase project is created
- [ ] Firestore is enabled
- [ ] Security rules are configured
- [ ] Indexes are created
- [ ] Admin users are added to `admins` collection
- [ ] Users have `role` field in their documents
- [ ] Environment variables are set in `.env`
- [ ] Testing completed (send and receive notifications)
- [ ] Error handling works properly
- [ ] Real-time updates are instant

## 🎉 Success!

Your real-time notification system is now ready! Admins can send notifications that instantly appear on user devices without any refresh needed.

For questions or issues, check the Firebase console logs and ensure all setup steps are completed.
