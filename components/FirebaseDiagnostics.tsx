import { addDoc, collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../lib/firebase';

/**
 * Firebase Diagnostics Component
 * Add this to your admin dashboard to check permissions
 */
export default function FirebaseDiagnostics() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const log = (message: string, isError = false) => {
    const emoji = isError ? '❌' : '✅';
    const fullMessage = `${emoji} ${message}`;
    console.log(fullMessage);
    setResults(prev => [...prev, fullMessage]);
  };

  const runDiagnostics = async () => {
    setResults([]);
    setTesting(true);

    try {
      log('🔍 Starting Firebase diagnostics...');

      // 1. Check Authentication
      log('\n📋 Step 1: Check Authentication');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        log('User NOT authenticated', true);
        log('Please log in first!', true);
        setTesting(false);
        return;
      }
      
      log(`User authenticated: ${currentUser.email}`);
      log(`User UID: ${currentUser.uid}`);

      // 2. Check Admin Document
      log('\n📋 Step 2: Check Admin Document');
      try {
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        
        if (!adminDoc.exists()) {
          log('Admin document NOT found', true);
          log(`You need to create: admins/${currentUser.uid}`, true);
          log('Fields: { email, name, role: "admin" }', true);
          
          Alert.alert(
            'Admin Document Missing',
            `Create a document in Firestore:\n\nCollection: admins\nDocument ID: ${currentUser.uid}\n\nFields:\n- email: ${currentUser.email}\n- name: Admin\n- role: admin`
          );
          setTesting(false);
          return;
        }
        
        log(`Admin document found`);
        log(`Admin data: ${JSON.stringify(adminDoc.data(), null, 2)}`);
      } catch (adminError: any) {
        log(`Admin check failed: ${adminError.message}`, true);
        setTesting(false);
        return;
      }

      // 3. Test Write to Notifications
      log('\n📋 Step 3: Test Write to Notifications Collection');
      try {
        const testNotification = {
          title: 'Diagnostic Test',
          message: 'Testing write permissions',
          type: 'general',
          targetAudience: 'all',
          sentBy: currentUser.email || 'Admin',
          sentDate: new Date(),
          readBy: []
        };
        
        const docRef = await addDoc(collection(db, 'notifications'), testNotification);
        log(`Successfully wrote to notifications collection`);
        log(`Document ID: ${docRef.id}`);
      } catch (writeError: any) {
        log(`Cannot write to notifications: ${writeError.message}`, true);
        log('Firestore rules are blocking access', true);
        log('Update rules in Firebase Console', true);
        
        Alert.alert(
          'Firestore Rules Error',
          'Your Firestore security rules are blocking writes. Update them in Firebase Console:\n\n1. Go to Firestore Database\n2. Click Rules tab\n3. Update rules to allow admin writes\n4. Publish changes'
        );
        setTesting(false);
        return;
      }

      // 4. Check Users Collection
      log('\n📋 Step 4: Check Users Collection');
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        log(`Found ${usersSnapshot.size} users`);
        
        if (usersSnapshot.size === 0) {
          log('No users found - notifications won\'t be sent to anyone');
          log('Create user documents in Firestore', true);
        } else {
          log('Users collection is populated');
        }
      } catch (userError: any) {
        log(`Error reading users: ${userError.message}`, true);
      }

      // 5. Check UserNotifications Write
      log('\n📋 Step 5: Test Write to UserNotifications Collection');
      try {
        const testUserNotification = {
          notificationId: 'test123',
          userId: currentUser.uid,
          title: 'Test',
          message: 'Test message',
          type: 'general',
          sentBy: currentUser.email,
          read: false,
          receivedAt: new Date(),
          metadata: {}
        };
        
        const docRef = await addDoc(collection(db, 'userNotifications'), testUserNotification);
        log(`Successfully wrote to userNotifications collection`);
        log(`Document ID: ${docRef.id}`);
      } catch (writeError: any) {
        log(`Cannot write to userNotifications: ${writeError.message}`, true);
      }

      log('\n🎉 All diagnostics completed!');
      Alert.alert('Success', 'All checks passed! You should be able to send notifications now.');

    } catch (error: any) {
      log(`\nUnexpected error: ${error.message}`, true);
      console.error('Full error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Firebase Diagnostics</Text>
      <Text style={styles.subtitle}>
        Run this to check your Firebase setup and permissions
      </Text>

      <Button 
        title={testing ? "Running Tests..." : "Run Diagnostics"}
        onPress={runDiagnostics}
        disabled={testing}
      />

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text 
            key={index} 
            style={[
              styles.resultText,
              result.includes('❌') && styles.errorText
            ]}
          >
            {result}
          </Text>
        ))}
      </ScrollView>

      {results.length > 0 && (
        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            Check FIREBASE_PERMISSION_TROUBLESHOOTING.md for detailed solutions.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0f0',
    marginBottom: 5,
  },
  errorText: {
    color: '#f00',
  },
  helpBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 14,
    color: '#856404',
  },
});
