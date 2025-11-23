# 🔥 Firebase Permission Error - Complete Fix Guide

## Error: "Missing or insufficient permissions"

This error means Firebase Firestore is blocking your notification operations. Follow these steps **IN ORDER**:

---

## Step 1: Update Firestore Security Rules ✅

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** in left menu
4. Click **"Rules"** tab at top
5. **Replace ALL rules** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Notifications collection - Admins can write, authenticated users can read
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && isAdmin();
      allow update, delete: if request.auth != null && isAdmin();
    }
    
    // User Notifications - Users read their own, admins create
    match /userNotifications/{notificationId} {
      allow read: if request.auth != null && 
                    resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                     resource.data.userId == request.auth.uid &&
                     request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['read', 'readAt']);
      allow create: if request.auth != null && isAdmin();
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null;
    }
    
    // Admins collection - Only admins can access
    match /admins/{adminId} {
      allow read: if request.auth != null && isAdmin();
      allow write: if request.auth != null && isAdmin();
    }
    
    // Profiles collection
    match /profiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == profileId || isAdmin());
      allow create: if request.auth != null;
    }
    
    // Blood requests
    match /bloodRequests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

6. Click **"Publish"** button
7. Wait 10 seconds for rules to propagate

---

## Step 2: Create Admin Document 👤

**CRITICAL**: Your user must exist in the `admins` collection.

### Option A: Using Firebase Console (Recommended)

1. In Firebase Console → Firestore Database → **"Data"** tab
2. Check if collection `admins` exists
3. If not, click **"Start collection"**
   - Collection ID: `admins`
   - Click "Next"
4. Create a document:
   - **Document ID**: (Your user UID - see Step 3 to find it)
   - Add fields:
     - Field: `email` | Type: string | Value: `your-admin@email.com`
     - Field: `name` | Type: string | Value: `Admin`
     - Field: `role` | Type: string | Value: `admin`
   - Click **"Save"**

### Option B: Using Code

Add this to your admin login after successful authentication:

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// After successful login
const user = userCredential.user;
await setDoc(doc(db, 'admins', user.uid), {
  email: user.email,
  name: 'Admin',
  role: 'admin',
  createdAt: new Date()
});
```

---

## Step 3: Find Your User UID 🔍

You need your authenticated user's UID to create the admin document.

### Method 1: Firebase Console
1. Firebase Console → **Authentication** → **Users** tab
2. Find your email
3. Copy the **User UID** column

### Method 2: In App Console
Add this temporarily to your admin login:

```typescript
const handleLogin = async () => {
  // ... existing login code
  const user = auth.currentUser;
  console.log('🆔 Your UID:', user?.uid);
  console.log('📧 Your email:', user?.email);
  alert(`Your UID: ${user?.uid}`);
};
```

### Method 3: Run Diagnostic Script
```bash
node scripts/check-firebase-setup.js
```

---

## Step 4: Verify Setup ✅

Run the diagnostic script to test everything:

```bash
cd "c:\Users\vigit\Desktop\EDONOR\E-Donor"
node scripts/check-firebase-setup.js
```

Enter your admin email and password when prompted.

The script will:
- ✅ Test Firebase connection
- ✅ Test authentication
- ✅ Check if you're in admins collection
- ✅ Test write permissions
- ✅ Check users collection

---

## Step 5: Create Test Users (Optional) 👥

If you get "No users found" warning:

1. Firebase Console → Firestore Database → **"Data"** tab
2. Create collection: `users`
3. Create a document:
   - Document ID: (any UID or auto-generate)
   - Fields:
     - `email`: string → `testuser@example.com`
     - `name`: string → `Test User`
     - `role`: string → `donor` (or `recipient`)
     - `bloodType`: string → `O+`
4. Create 2-3 test users

---

## Step 6: Test Notification Send 📤

1. Log in to admin panel
2. Go to Notifications section
3. Try sending a test notification
4. Check browser console for detailed logs:
   - `📤 Sending notification...`
   - `👤 Current user: ...`
   - `✅ Admin verified`
   - `✅ Notification document created`

---

## Common Issues & Solutions

### Issue: "User not authenticated"
**Solution**: Make sure you're logged in before sending notifications.

### Issue: "Access denied: User is not an admin"
**Solution**: Create the admin document in Step 2. The UID must match exactly.

### Issue: "Cannot write to notifications collection"
**Solution**: Update Firestore rules in Step 1 and wait 10 seconds.

### Issue: "No target users found"
**Solution**: Create test users in Step 5, or verify users have correct `role` field.

### Issue: Still getting permissions error
**Temporary workaround** (for testing only):
```javascript
// TEMPORARY RULES - NOT SECURE
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
This allows all authenticated users to read/write. Use only for testing!

---

## Quick Checklist ✓

- [ ] Firestore rules updated and published
- [ ] Admin document created with correct UID
- [ ] User is authenticated before sending
- [ ] At least one user document exists (for testing)
- [ ] Waited 10+ seconds after publishing rules
- [ ] Cleared app cache / restarted app

---

## Need More Help?

Check the enhanced error messages in the console. The updated `notificationService.ts` now shows:
- Authentication status
- Admin verification details
- Exact error location
- Helpful suggestions

If still stuck, run:
```bash
node scripts/check-firebase-setup.js
```

This will pinpoint the exact issue.
