# Real-Time Notifications Quick Reference

## 🚀 Quick Start

### 1. Firebase Setup (5 minutes)
```bash
# Install dependencies (already done)
npm install firebase

# Configure Firestore indexes in Firebase Console:
- Go to Firestore Database → Indexes
- Create composite index: userNotifications (userId ASC, receivedAt DESC)
```

### 2. Add Admin User (2 minutes)
```javascript
// In Firebase Console → Firestore → Create Collection 'admins'
{
  id: "your-user-id",  // Use your Firebase Auth UID
  name: "Admin Name",
  email: "admin@example.com",
  role: "admin"
}
```

### 3. Test It! (1 minute)
1. Login as admin
2. Go to Admin Notifications page
3. Click "Send Notification"
4. Fill form and send
5. Open user notifications page → Should appear instantly! ⚡

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/services/notificationService.ts` | Core notification logic |
| `app/admin-notifications.tsx` | Admin send notifications |
| `app/notifications.tsx` | User receive notifications |
| `lib/firebase.ts` | Firebase configuration |

## 🎯 How to Send Notification (Admin)

```typescript
import { sendNotification } from './services/notificationService';

await sendNotification({
  title: "Urgent: Blood Needed",
  message: "O- blood urgently needed at City Hospital",
  type: "urgent",
  targetAudience: "donors",
  sentBy: "Admin Name",
});
```

## 📱 How to Listen for Notifications (User)

```typescript
import { listenToUserNotifications } from './services/notificationService';
import { auth } from '../lib/firebase';

useEffect(() => {
  const unsubscribe = listenToUserNotifications(
    auth.currentUser?.uid,
    (notifications) => {
      setNotifications(notifications);  // Instant update! ⚡
    }
  );
  
  return () => unsubscribe();  // Cleanup
}, []);
```

## 🎨 Notification Types

```typescript
type NotificationType = 
  | 'critical'   // 🔴 Red - Life threatening
  | 'urgent'     // 🟠 Orange - Important
  | 'info'       // 🔵 Blue - General info
  | 'success'    // 🟢 Green - Success message
  | 'general'    // 🔵 Blue - General
  | 'reminder'   // 🟡 Yellow - Reminder
  | 'event';     // 🔵 Blue - Event
```

## 🎯 Target Audiences

```typescript
type TargetAudience = 
  | 'all'         // All users
  | 'donors'      // Only donors
  | 'recipients'  // Only recipients
  | 'specific';   // Specific user IDs
```

## 🔥 Real-Time Magic

**Traditional Approach (Old):**
```typescript
// ❌ User must refresh to see new notifications
const getNotifications = async () => {
  const snapshot = await getDocs(query(...));
  setNotifications(snapshot.docs);
};
```

**Real-Time Approach (New):**
```typescript
// ✅ Notifications appear instantly, no refresh!
const unsubscribe = onSnapshot(query(...), (snapshot) => {
  setNotifications(snapshot.docs);  // Auto-updates! ⚡
});
```

## 📊 Common Use Cases

### 1. Urgent Blood Request
```typescript
await sendNotification({
  title: "🩸 Critical: O- Blood Needed",
  message: "Patient in emergency surgery needs O- blood immediately",
  type: "critical",
  targetAudience: "donors",
  sentBy: "Hospital Admin",
  metadata: {
    bloodType: "O-",
    location: "City Hospital",
    requestId: "REQ-123"
  }
});
```

### 2. Event Announcement
```typescript
await sendNotification({
  title: "📅 Blood Drive This Weekend",
  message: "Join us at City Park for community blood drive",
  type: "event",
  targetAudience: "all",
  sentBy: "Event Coordinator",
  metadata: {
    eventDate: "2025-11-25",
    location: "City Park"
  }
});
```

### 3. Thank You Message
```typescript
await sendNotification({
  title: "🎉 Thank You!",
  message: "Your donation helped save 3 lives",
  type: "success",
  targetAudience: "specific",
  targetUserIds: ["user-123"],
  sentBy: "Blood Bank",
});
```

## 🛠️ Useful Functions

### Mark as Read
```typescript
await markNotificationAsRead(notificationId, userId);
```

### Mark All as Read
```typescript
await markAllNotificationsAsRead(userId);
```

### Get Unread Count
```typescript
const count = await getUnreadNotificationCount(userId);
```

### Admin Dashboard Stats
```typescript
const unsubscribe = listenToAdminNotifications((notifications) => {
  // Shows: total sent, read count, delivery stats
  console.log(notifications);
});
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Notifications not appearing | Check user is logged in: `auth.currentUser` |
| Real-time not working | Verify Firestore indexes created |
| Permission denied | Check Firestore security rules |
| Listener not updating | Ensure useEffect cleanup returns unsubscribe |

## 📈 Performance Tips

✅ **Do:**
- Use limit() in queries (default: 50)
- Clean up listeners on unmount
- Create Firestore indexes
- Use serverTimestamp() for dates

❌ **Don't:**
- Fetch all notifications at once
- Forget to unsubscribe listeners
- Query without indexes
- Update every notification individually (use batch)

## 🔒 Security Rules Quick Copy

```javascript
// Firestore Rules - Copy to Firebase Console
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /userNotifications/{notificationId} {
      allow read: if request.auth != null && 
                    resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
    }
    
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## 📱 Testing Checklist

- [ ] Send notification as admin
- [ ] Receive on user device instantly
- [ ] Mark notification as read
- [ ] Mark all as read
- [ ] Filter by unread
- [ ] See accurate stats on admin dashboard
- [ ] Listener cleanup on unmount
- [ ] Works with app in background
- [ ] Multiple users receive simultaneously

## 🎓 Key Concepts

**Firestore Snapshot Listener:**
- Listens for real-time changes
- Updates automatically
- More efficient than polling
- Works offline (with cache)

**Why Two Collections?**
- `notifications` → Admin dashboard & stats
- `userNotifications` → Individual user inboxes
- Allows per-user read status tracking

**Unsubscribe Pattern:**
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(...);
  return () => unsubscribe();  // Critical!
}, []);
```

## 💡 Pro Tips

1. **Use notification templates** - Faster sending, consistent messaging
2. **Include metadata** - Store request IDs, blood types, locations
3. **Time-based queries** - Show recent notifications first
4. **Pagination** - Load more with infinite scroll
5. **Sound/vibration** - Add push notifications for closed app
6. **Analytics** - Track delivery rate, read rate, response time

## 🎯 Next Steps

1. ✅ Real-time notifications (Done!)
2. ⏭️ Add push notifications (optional)
3. ⏭️ Rich notifications with images
4. ⏭️ Notification preferences
5. ⏭️ Scheduled notifications
6. ⏭️ Email fallback

## 📚 Learn More

- [Firebase Firestore Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [React useEffect Cleanup](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

---

**Need Help?** Check the detailed guides:
- `FIREBASE_NOTIFICATIONS_SETUP.md` - Full setup instructions
- `PUSH_NOTIFICATIONS_SETUP.md` - Push notification setup

**Status: ✅ Ready to Use!**

Your real-time notification system is live and working! Admin can send, users receive instantly. 🎉
