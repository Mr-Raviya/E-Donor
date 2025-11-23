# 🧪 Test Notification Guide

## Quick Test Steps

### Step 1: Open the App
Your app is running on port 8084. You can access it by:

**Option A: Web Browser (Easiest)**
1. Press `w` in your terminal where Expo is running
2. This will open the app in your browser at http://localhost:8084

**Option B: Expo Go App**
1. Scan the QR code shown in your terminal
2. The app will open in Expo Go

---

### Step 2: Navigate to Admin Login
1. Once the app opens, navigate to the Admin Login page
2. Login with your admin credentials
   - Admin UID should be: `ZIiIcjNk2uPxSHAl1MHrEQMZB2J3` (from your existing admin document)

---

### Step 3: Send Test Notification
1. Navigate to **Admin Notifications** page (`/admin-notifications`)
2. Fill in the notification form:
   
   ```
   Title: 🎉 Test Notification
   Message: This is a test notification. If you receive this, the system is working!
   Type: info (or any type you prefer)
   Target Audience: all
   ```

3. Click **"Send Notification"** button

---

### Step 4: Check Console Logs
**IMPORTANT**: Open your browser console (F12 → Console tab) to see debug logs:

You should see:
- `📤 Sending notification: Test Notification`
- `🔍 Getting target user IDs for audience: all`
- `✅ Found X users` (where X is the number of users)
- `✅ Notification sent successfully!`

**If you see:**
- `⚠️ No users found for audience: all` → You need to create users in Firestore

---

### Step 5: Verify Receipt (If You Have Users)
1. Login as a regular user (not admin)
2. Navigate to **Notifications** page (`/notifications`)
3. You should see the test notification appear **instantly** without refreshing

---

## 🚨 Troubleshooting

### Problem: "⚠️ No users found for audience: all"

This means your `users` collection is empty. You need to create test users:

#### Solution: Create Test Users in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Click **"Start collection"** (if users collection doesn't exist)
5. Collection ID: `users`
6. Add a test user document:

```json
Document ID: (Use your Firebase Auth UID or create a custom ID)
{
  "email": "testuser@example.com",
  "name": "Test User",
  "role": "donor",
  "bloodType": "O+",
  "createdAt": (use Timestamp)
}
```

7. Click **"Save"**
8. Add more users with different roles:
   - Some with `role: "donor"`
   - Some with `role: "recipient"`

---

### Problem: Notification Sent but Not Received

**Check 1: User is logged in**
- Console log: `console.log(auth.currentUser)` should show user data

**Check 2: Firestore Rules**
- Go to Firebase Console → Firestore Database → Rules
- Make sure you've published the rules from `FIREBASE_NOTIFICATIONS_SETUP.md`

**Check 3: Indexes**
- Go to Firebase Console → Firestore Database → Indexes
- Wait 5-10 minutes for indexes to build if they were just created
- Or click the auto-generated link in console errors

**Check 4: Listener is Active**
- In `app/notifications.tsx`, the `useEffect` should be running
- Check console for "Listening to notifications for user: [userId]"

---

### Problem: Permission Denied Errors

**Solution**: Update Firestore Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the rules from the attached `FIREBASE_NOTIFICATIONS_SETUP.md` file
3. Click **"Publish"**

---

## 📊 Expected Console Output (Success)

When everything works correctly, you should see:

### Admin Side (Sending):
```
📤 Sending notification: 🎉 Test Notification
🔍 Getting target user IDs for audience: all
✅ Found 5 users matching role criteria
✅ Notification sent successfully! ID: abc123xyz
✅ Created 5 user notifications
```

### User Side (Receiving):
```
👂 Listening to notifications for user: user123
📬 Received 1 new notifications
Notifications updated: [{title: "🎉 Test Notification", ...}]
```

---

## ✅ Success Checklist

- [ ] App is running (port 8084)
- [ ] Opened app in browser with `w` key
- [ ] Browser console is open (F12)
- [ ] Logged in as admin
- [ ] Users collection exists with test users
- [ ] Firestore rules are published
- [ ] Sent test notification
- [ ] Console shows "✅ Notification sent successfully!"
- [ ] Logged in as user and received notification

---

## 🎯 Next Steps After Successful Test

1. **Add more users** to test targeted notifications (donors only, recipients only)
2. **Test different notification types** (critical, urgent, success, etc.)
3. **Test mark as read** functionality
4. **Test real-time updates** (send notification while user page is open)
5. **Check notification history** in admin dashboard

---

## 📞 Still Having Issues?

If notifications still don't work after following this guide:

1. Share the **exact console output** (copy all logs)
2. Check **Firebase Console → Firestore Database** and share:
   - Number of documents in `users` collection
   - Number of documents in `admins` collection
   - Screenshot of any error in the Rules tab
3. Confirm you're using the correct **admin UID**: `ZIiIcjNk2uPxSHAl1MHrEQMZB2J3`

---

## 🚀 Quick Command Reference

**Open app in browser:**
```bash
# In the terminal where Expo is running, press: w
```

**Check terminal logs:**
```bash
# All logs appear in the terminal automatically
```

**Restart with clean cache:**
```bash
cd E-Donor
npx expo start --clear --port 8084
```

---

Good luck! 🍀
