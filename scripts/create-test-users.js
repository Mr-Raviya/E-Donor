/**
 * Script to create test users in Firestore
 * Run this to populate your users collection so notifications can be sent
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const readline = require('readline');

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Test users to create
const testUsers = [
  {
    id: 'user1',
    email: 'donor1@test.com',
    name: 'John Donor',
    role: 'donor',
    bloodType: 'O+',
    phoneNumber: '+1234567890',
    location: 'New York',
  },
  {
    id: 'user2',
    email: 'donor2@test.com',
    name: 'Sarah Smith',
    role: 'donor',
    bloodType: 'A+',
    phoneNumber: '+1234567891',
    location: 'Los Angeles',
  },
  {
    id: 'user3',
    email: 'recipient1@test.com',
    name: 'Mike Johnson',
    role: 'recipient',
    bloodType: 'B+',
    phoneNumber: '+1234567892',
    location: 'Chicago',
  },
  {
    id: 'user4',
    email: 'donor3@test.com',
    name: 'Emily Davis',
    role: 'donor',
    bloodType: 'AB-',
    phoneNumber: '+1234567893',
    location: 'Houston',
  },
  {
    id: 'user5',
    email: 'recipient2@test.com',
    name: 'David Wilson',
    role: 'recipient',
    bloodType: 'O-',
    phoneNumber: '+1234567894',
    location: 'Phoenix',
  },
];

async function createTestUsers() {
  console.log('🔧 Creating Test Users in Firestore...\n');

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
      rl.question('Enter admin email: ', resolve);
    });

    const password = await new Promise(resolve => {
      rl.question('Enter admin password: ', resolve);
    });
    rl.close();

    console.log('\n3️⃣ Authenticating...');
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authenticated as admin\n');

    // Create test users
    console.log('4️⃣ Creating test users...');
    let successCount = 0;
    
    for (const user of testUsers) {
      try {
        await setDoc(doc(db, 'users', user.id), {
          email: user.email,
          name: user.name,
          role: user.role,
          bloodType: user.bloodType,
          phoneNumber: user.phoneNumber,
          location: user.location,
          isActive: true,
          lastDonation: null,
          createdAt: new Date(),
        });
        
        console.log(`✅ Created user: ${user.name} (${user.role}, ${user.bloodType})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create ${user.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${successCount}/${testUsers.length} test users!`);
    console.log('\n📊 Summary:');
    console.log(`   - Total users: ${successCount}`);
    console.log(`   - Donors: ${testUsers.filter(u => u.role === 'donor').length}`);
    console.log(`   - Recipients: ${testUsers.filter(u => u.role === 'recipient').length}`);
    console.log('\n✅ You can now send notifications to these users!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }

  process.exit(0);
}

createTestUsers();
