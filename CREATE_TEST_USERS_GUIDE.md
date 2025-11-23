# 🎯 FINAL FIX: Create Test Users

## Current Status

✅ Admin verified  
✅ Notification created in Firestore  
❌ **No users found** - Can't send to anyone  
❌ **Permission errors** - Listener issues  

## Solution: Create Test Users

### Option 1: Firebase Console (EASIEST - 2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open **Firestore Database** → **Data** tab
3. Create collection: **`users`** (if not exists)
4. Add documents with these details:

#### User 1 - Donor
- Document ID: `user1` (or auto-generate)
- Fields:
  ```
  email: "donor1@test.com"
  name: "John Donor"
  role: "donor"
  bloodType: "O+"
  location: "New York"
  isActive: true
  ```

#### User 2 - Donor
- Document ID: `user2`
- Fields:
  ```
  email: "donor2@test.com"
  name: "Sarah Smith"
  role: "donor"
  bloodType: "A+"
  location: "Los Angeles"
  isActive: true
  ```

#### User 3 - Recipient
- Document ID: `user3`
- Fields:
  ```
  email: "recipient1@test.com"
  name: "Mike Johnson"
  role: "recipient"
  bloodType: "B+"
  location: "Chicago"
  isActive: true
  ```

**Just add 2-3 users to start!**

### Option 2: Using Your Admin App

Add a "Create Test Users" button in your admin panel:

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const createTestUsers = async () => {
  const users = [
    { id: 'user1', email: 'donor1@test.com', name: 'John Donor', role: 'donor', bloodType: 'O+' },
    { id: 'user2', email: 'donor2@test.com', name: 'Sarah Smith', role: 'donor', bloodType: 'A+' },
    { id: 'user3', email: 'recipient1@test.com', name: 'Mike Johnson', role: 'recipient', bloodType: 'B+' },
  ];

  for (const user of users) {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      isActive: true,
      createdAt: new Date(),
    });
  }
  
  Alert.alert('Success', 'Test users created!');
};
```

---

## Fix Permission Errors on Listener

The permission errors are from the real-time listener. Update your Firestore rules to allow reading stats:

```javascript
match /userNotifications/{notificationId} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    exists(/databases/$(database)/documents/admins/$(request.auth.uid))
  );
  allow create: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
  allow update: if request.auth != null && resource.data.userId == request.auth.uid;
}
```

This allows admins to read ALL userNotifications (for stats).

---

## Complete Updated Firestore Rules

Copy this to Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Notifications - Admins can write, authenticated can read
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    
    // User Notifications - Users read their own, admins read all (for stats)
    match /userNotifications/{notificationId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        isAdmin()
      );
      allow create: if request.auth != null && isAdmin();
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Admins collection
    match /admins/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if request.auth != null && isAdmin();
    }
    
    // Profiles collection
    match /profiles/{profileId} {
      allow read, write: if request.auth != null;
    }
    
    // Blood requests
    match /bloodRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish** and wait 10 seconds.

---

## Test Again

1. **Update Firestore rules** (see above)
2. **Create 2-3 test users** in Firebase Console
3. **Send a notification**

You should see:
```
📤 Sending notification: ...
✅ Admin verified
✅ Notification document created
✅ Found 3 users for 'all' audience
✅ Created 3 user notifications
✅ Notification sent successfully!
```

No more errors! 🎉

---

## Quick Steps Checklist

- [ ] Update Firestore rules (allow admins to read userNotifications)
- [ ] Click Publish
- [ ] Wait 10 seconds
- [ ] Create 2-3 test users in `users` collection
- [ ] Try sending notification again
- [ ] Check console - should show users found
- [ ] No permission errors!

---

**The key fix:** Admins need permission to read `userNotifications` to get statistics. The updated rules allow this.
