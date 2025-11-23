/**
 * Firebase Setup Diagnostic Script
 * Run this to check your Firebase configuration and permissions
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, doc, getDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

async function checkSetup() {
  console.log('🔍 Starting Firebase Setup Diagnostic...\n');
  
  try {
    // 1. Initialize Firebase
    console.log('1️⃣ Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully\n');

    // 2. Get admin credentials from command line
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const email = await new Promise(resolve => {
      readline.question('Enter admin email: ', resolve);
    });

    const password = await new Promise(resolve => {
      readline.question('Enter admin password: ', resolve);
    });

    readline.close();

    // 3. Test authentication
    console.log('\n2️⃣ Testing authentication...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Authentication successful');
    console.log('   User ID:', user.uid);
    console.log('   Email:', user.email);

    // 4. Check if user is in admins collection
    console.log('\n3️⃣ Checking admin collection...');
    const adminDocRef = doc(db, 'admins', user.uid);
    const adminDoc = await getDoc(adminDocRef);
    
    if (adminDoc.exists()) {
      console.log('✅ User found in admins collection');
      console.log('   Admin data:', adminDoc.data());
    } else {
      console.log('❌ ERROR: User NOT found in admins collection');
      console.log('   You need to create this document in Firestore:');
      console.log('   Collection: admins');
      console.log('   Document ID:', user.uid);
      console.log('   Fields:');
      console.log('     - email:', user.email);
      console.log('     - name: "Admin"');
      console.log('     - role: "admin"');
      console.log('\n   Go to Firebase Console > Firestore Database > Create document');
      return;
    }

    // 5. Test writing to notifications collection
    console.log('\n4️⃣ Testing write to notifications collection...');
    try {
      const testNotification = {
        title: 'Test Notification',
        message: 'Testing permissions',
        type: 'general',
        targetAudience: 'all',
        sentBy: user.email,
        sentDate: new Date(),
        readBy: []
      };
      
      const docRef = await addDoc(collection(db, 'notifications'), testNotification);
      console.log('✅ Successfully wrote to notifications collection');
      console.log('   Document ID:', docRef.id);
    } catch (writeError) {
      console.log('❌ ERROR: Cannot write to notifications collection');
      console.log('   Error:', writeError.message);
      console.log('\n   This means your Firestore rules are blocking access.');
      console.log('   Update your Firestore rules in Firebase Console.');
      return;
    }

    // 6. Check users collection
    console.log('\n5️⃣ Checking users collection...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`   Found ${usersSnapshot.size} users in collection`);
    
    if (usersSnapshot.size === 0) {
      console.log('⚠️  WARNING: No users found');
      console.log('   Notifications won\'t be sent to anyone.');
      console.log('   Create user documents or test with "all" audience.');
    } else {
      console.log('✅ Users collection has data');
    }

    console.log('\n🎉 All checks passed! Your setup is ready.');
    console.log('   You should be able to send notifications now.');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

checkSetup().then(() => process.exit(0));
