/**
 * Sync Firebase Authentication Users to Firestore Users Collection
 * This creates user documents in Firestore for all authenticated users
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDoc } = require('firebase/firestore');
const admin = require('firebase-admin');
const readline = require('readline');

// Your Firebase config (client SDK)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

async function syncAuthUsersToFirestore() {
  console.log('🔄 Syncing Auth Users to Firestore...\n');

  try {
    // Initialize Firebase
    console.log('1️⃣ Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized\n');

    // Authenticate as admin
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('2️⃣ Admin Authentication Required');
    const email = await new Promise(resolve => {
      rl.question('Enter admin email (service.edonor@gmail.com): ', resolve);
    });

    const password = await new Promise(resolve => {
      rl.question('Enter admin password: ', resolve);
    });
    rl.close();

    console.log('\n3️⃣ Authenticating...');
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authenticated as admin\n');

    // Manually list your users (since Admin SDK needs service account)
    console.log('4️⃣ Enter your authenticated users:');
    console.log('From Firebase Console → Authentication → Users\n');

    const users = [
      { uid: 'YBplfLKu0bcsN...', email: 'q@gmail.com', name: 'User Q' },
      { uid: 'ZIiIcjNk2uPxSH...', email: 'service.edonor@gmail.com', name: 'Admin' },
      { uid: '3OI7KuF57ceI3Q...', email: 'k@k.com', name: 'User K' },
      { uid: 'BDXKzd5czJaih...', email: 'c@c.com', name: 'User C' },
      { uid: 'yMwoikdKY9NV...', email: 'raviyamr@...', name: 'Raviya' },
    ];

    console.log('\n⚠️  UPDATE THE SCRIPT:');
    console.log('Edit scripts/sync-auth-to-firestore.js');
    console.log('Replace the users array with your actual UIDs from the screenshot.\n');

    // Create user documents
    console.log('5️⃣ Creating user documents in Firestore...');
    let successCount = 0;

    for (const user of users) {
      try {
        // Check if document already exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          console.log(`⏭️  Skipped ${user.email} (already exists)`);
          continue;
        }

        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.name,
          role: user.email.includes('admin') || user.email.includes('service') ? 'admin' : 'donor',
          bloodType: 'O+', // Default, users can update later
          isActive: true,
          createdAt: new Date(),
        });

        console.log(`✅ Created: ${user.email} (${user.uid})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed ${user.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully synced ${successCount} users!`);
    console.log('\n✅ You can now send notifications to all users!');
    console.log('   Try sending with targetAudience: "all"');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }

  process.exit(0);
}

syncAuthUsersToFirestore();
