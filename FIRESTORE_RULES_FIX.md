# 🔒 Fix Firebase Insufficient Permissions Error

## Problem
You're getting "uncaught firebase insufficient permissions" error because Firestore security rules are blocking the notification operations.

## Solution - Update Firestore Rules

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** in the left menu
4. Click the **"Rules"** tab at the top

### Step 2: Replace Existing Rules

Copy and paste these rules (they replace ALL existing rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Notifications - Only admins can write, anyone authenticated can read
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
    
    // User Notifications - Users can read their own, admins can create
    match /userNotifications/{notificationId} {
      allow read: if request.auth != null && 
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow update: if request.auth != null && 
                     resource.data.userId == request.auth.uid &&
                     request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['read', 'readAt']);
      allow create: if request.auth != null && isAdmin();
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Users collection - Anyone authenticated can read, users can update their own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null;
    }
    
    // Admins collection - Only admins can read/write
    match /admins/{adminId} {
      allow read: if request.auth != null && isAdmin();
      allow write: if request.auth != null && isAdmin();
    }
    
    // Profiles collection (your existing collection)
    match /profiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == profileId || isAdmin());
      allow create: if request.auth != null;
    }
    
    // Blood requests collection (if you have one)
    match /bloodRequests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 3: Publish the Rules

1. After pasting the rules, click **"Publish"** button
2. Wait 5-10 seconds for rules to propagate
3. You should see "Rules published successfully"

---

## Alternative: Temporary Open Rules (FOR TESTING ONLY)

If you want to quickly test without restrictions, use these **TEMPORARY** rules:

⚠️ **WARNING**: These rules are NOT secure and should only be used for testing!

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

After testing, **REPLACE** with the secure rules above!

---

## Step 4: Verify Admin Document Exists

Your admin document should exist at:
- Collection: `admins`
- Document ID: `ZIiIcjNk2uPxSHAl1MHrEQMZB2J3`

In Firebase Console:
1. Go to Firestore Database
2. Find the `admins` collection
3. Verify your admin document exists with your Firebase Auth UID

If it doesn't exist, create it:
```
Collection: admins
Document ID: [Your Firebase Auth UID]
Fields:
  email: "your-admin-email@example.com"
  name: "Admin Name"
  role: "admin"
```

---

## Step 5: Create Test User (If Not Exists)

To receive notifications, you need at least one user document:

1. Go to Firestore Database
2. Create/check the `users` collection
3. Add a test user document:

```
Collection: users
Document ID: [Any user's Firebase Auth UID]
Fields:
  email: "testuser@example.com"
  name: "Test User"
  role: "donor"
  bloodType: "O+"
```

---

## After Publishing Rules - Test Again

1. **Refresh your app** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Open browser console** (F12)
3. **Login as admin**
4. **Try sending a notification** from `/admin-notifications`
5. **Check console logs** - you should see:
   - `📤 Sending notification: [title]`
   - `✅ Notification document created with ID: [id]`
   - `✅ Notification sent successfully!`

---

## Common Issues After Publishing Rules

### Issue 1: Still Getting Permission Denied
**Solution**: 
- Wait 10-15 seconds and try again
- Hard refresh the page (Ctrl+Shift+R)
- Check that you're logged in (console.log `auth.currentUser`)

### Issue 2: "Admin document doesn't exist"
**Solution**:
- Verify admin document exists in Firestore at `admins/[your-uid]`
- Make sure the document ID matches your Firebase Auth UID exactly
- Use `console.log(auth.currentUser.uid)` to confirm your UID

### Issue 3: "No users found"
**Solution**:
- Create at least one user document in the `users` collection
- Make sure the document has a `role` field set to "donor" or "recipient"

---

## Quick Verification Commands

Run these in your browser console after opening the app:

```javascript
// Check if you're logged in
console.log('Current User:', auth.currentUser);

// Check your UID (should match admin document ID)
console.log('My UID:', auth.currentUser?.uid);

// Try to read from Firestore (test permissions)
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

getDocs(collection(db, 'notifications'))
  .then(snapshot => console.log('✅ Can read notifications:', snapshot.size, 'docs'))
  .catch(error => console.error('❌ Permission denied:', error));
```

---

## ✅ Success Checklist

After publishing rules, verify:

- [ ] Rules are published in Firebase Console
- [ ] Admin document exists with your Firebase Auth UID
- [ ] At least one user document exists in `users` collection
- [ ] App is refreshed (hard refresh)
- [ ] You're logged in as admin
- [ ] Browser console shows no permission errors
- [ ] Can send notification without errors

---

## 🆘 Still Not Working?

Share the exact error message from browser console (F12), including:
1. Full error text
2. Your Firebase Auth UID (`auth.currentUser.uid`)
3. Screenshot of your `admins` collection in Firestore
4. Screenshot of Firestore Rules tab showing published rules

This will help diagnose the exact issue!
