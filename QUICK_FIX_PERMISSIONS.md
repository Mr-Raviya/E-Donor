# 🚨 QUICK FIX: Firebase Permission Error

## The Problem
You're getting "Missing or insufficient permissions" because:
1. Your admin user is NOT in the `admins` collection in Firestore
2. Or Firestore rules are blocking access

## 3-Step Fix (5 minutes)

### Step 1: Get Your User UID
1. Log in to your admin account in the app
2. Open browser console (F12)
3. You'll see: `👤 Current user: your@email.com | UID: abc123xyz`
4. **Copy the UID** (the long string after "UID:")

### Step 2: Create Admin Document
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** 
4. Click **"Start collection"** (or add to existing)
   - Collection ID: **`admins`**
   - Document ID: **[Paste your UID here]**
   - Add these fields:
     - `email`: (string) your-admin@email.com
     - `name`: (string) Admin
     - `role`: (string) admin
5. Click **Save**

### Step 3: Update Firestore Rules
1. In Firebase Console → Firestore Database → **Rules** tab
2. Copy and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    
    match /userNotifications/{notificationId} {
      // Users can read their own, ADMINS can read all (for statistics)
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        isAdmin()
      );
      allow create: if request.auth != null && isAdmin();
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && isAdmin();
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /admins/{adminId} {
      // Users can read their own admin document (to check if they're admin)
      // Only admins can write
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if request.auth != null && isAdmin();
    }
    
    match /profiles/{profileId} {
      allow read, write: if request.auth != null;
    }
    
    match /bloodRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**
4. Wait 10 seconds

## Test It

Try sending a notification. You should now see:
```
📤 Sending notification: ...
👤 Current user: your@email.com | UID: abc123xyz
✅ Admin verified: {email: ..., name: "Admin", role: "admin"}
✅ Notification document created with ID: xyz789
✅ Notification sent successfully!
```

## Still Not Working?

### Option 1: Use Diagnostics Component
Add this to your admin dashboard:

```typescript
import FirebaseDiagnostics from '../components/FirebaseDiagnostics';

// In your admin page
<FirebaseDiagnostics />
```

Click "Run Diagnostics" to see exactly what's wrong.

### Option 2: Temporary Open Rules (Testing Only)
⚠️ **NOT SECURE - Only for testing!**

Replace your rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

If this works, the problem is your admin document. Go back to Step 2.

## Common Mistakes

❌ Wrong UID in admin document → Must match exactly
❌ Didn't wait after publishing rules → Wait 10-30 seconds
❌ Not logged in when testing → Log in first
❌ Admin document in wrong collection → Must be in `admins` collection
❌ Typo in document field → Use `role: "admin"` not `isAdmin: true`

## Quick Checklist
- [ ] Found my user UID
- [ ] Created document: `admins/[MY_UID]`
- [ ] Added fields: email, name, role
- [ ] Updated Firestore rules
- [ ] Clicked Publish
- [ ] Waited 10 seconds
- [ ] Refreshed app / logged in again
- [ ] Tried sending notification

---

For detailed troubleshooting, see: `FIREBASE_PERMISSION_TROUBLESHOOTING.md`
