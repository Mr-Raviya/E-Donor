/**
 * Test Script to Send Notification
 * 
 * This script sends a test notification using Firebase Admin SDK
 * Run this from your terminal: node scripts/send-test-notification.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin
// You'll need to download your Firebase Admin SDK key from:
// Firebase Console → Project Settings → Service Accounts → Generate New Private Key

// For now, we'll use the web SDK approach
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Firebase Configuration:');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);

// Test notification data
const testNotification = {
  title: '🎉 Test Notification',
  message: 'This is a test notification sent from the script. If you receive this, the notification system is working correctly!',
  type: 'info',
  targetAudience: 'all',
  sentBy: 'Test Script',
  sentDate: new Date().toISOString(),
  metadata: {
    testMode: true,
    timestamp: Date.now()
  }
};

console.log('\n📤 Test Notification to Send:');
console.log(JSON.stringify(testNotification, null, 2));
console.log('\n⚠️  NOTE: To send this notification, you need to:');
console.log('1. Open your app in the browser (press "w" in the terminal)');
console.log('2. Navigate to the Admin Notifications page (/admin-notifications)');
console.log('3. Fill in the form with:');
console.log('   - Title: "🎉 Test Notification"');
console.log('   - Message: "This is a test notification"');
console.log('   - Type: "info"');
console.log('   - Target: "all"');
console.log('4. Click "Send Notification"');
console.log('\n✅ Then check the user notifications page to see if it appears!');
console.log('\n💡 TIP: Open browser console (F12) to see debug logs with emoji indicators');
