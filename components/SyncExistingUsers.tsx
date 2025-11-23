import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../lib/firebase';

/**
 * One-Time Sync Component
 * Run this once to sync all existing authenticated users to Firestore users collection
 * Add this component to your admin dashboard temporarily
 */
export default function SyncExistingUsers() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // IMPORTANT: Update these with actual UIDs from Firebase Authentication
  const existingUsers = [
    { uid: 'YBplfLKu0bcsN...', email: 'q@gmail.com', name: 'User Q', bloodType: 'O+' },
    { uid: 'ZIiIcjNk2uPxSHAl1MHrEQMZB2J3', email: 'service.edonor@gmail.com', name: 'Admin Service', bloodType: 'A+', role: 'admin' },
    { uid: '3OI7KuF57ceI3Q...', email: 'k@k.com', name: 'User K', bloodType: 'B+' },
    { uid: 'BDXKzd5czJaih...', email: 'c@c.com', name: 'User C', bloodType: 'AB+' },
    { uid: 'yMwoikdKY9NV...', email: 'raviyamr@gmail.com', name: 'Raviya', bloodType: 'O-' },
  ];

  const syncUsers = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Please log in as admin first');
      return;
    }

    setSyncing(true);
    setResults([]);
    const logs: string[] = [];

    try {
      logs.push('🔄 Starting sync...');
      setResults([...logs]);

      for (const user of existingUsers) {
        try {
          // Check if already exists
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            logs.push(`⏭️  Skipped: ${user.email} (already exists)`);
            setResults([...logs]);
            continue;
          }

          // Create user document
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: user.name,
            role: user.role || 'donor',
            bloodType: user.bloodType,
            isActive: true,
            createdAt: new Date(),
          });

          logs.push(`✅ Created: ${user.email}`);
          setResults([...logs]);
        } catch (error: any) {
          logs.push(`❌ Failed ${user.email}: ${error.message}`);
          setResults([...logs]);
        }
      }

      logs.push('\n🎉 Sync complete!');
      setResults([...logs]);
      Alert.alert('Success', 'All users synced successfully!');
    } catch (error: any) {
      logs.push(`\n❌ Error: ${error.message}`);
      setResults([...logs]);
      Alert.alert('Error', error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔄 Sync Existing Users</Text>
      <Text style={styles.subtitle}>
        This will create user documents for all existing authenticated users
      </Text>

      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ Before running, update the UIDs in the code with actual values from Firebase Authentication
        </Text>
      </View>

      <Button 
        title={syncing ? "Syncing..." : "Sync All Users"}
        onPress={syncUsers}
        disabled={syncing}
      />

      {syncing && <ActivityIndicator size="large" color="#DC143C" style={styles.loader} />}

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text 
            key={index} 
            style={[
              styles.resultText,
              result.includes('❌') && styles.errorText,
              result.includes('✅') && styles.successText
            ]}
          >
            {result}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How to use:</Text>
        <Text style={styles.infoText}>
          1. Update the existingUsers array with actual UIDs{'\n'}
          2. Log in as admin{'\n'}
          3. Click "Sync All Users"{'\n'}
          4. Wait for completion{'\n'}
          5. Remove this component from your app
        </Text>
      </View>
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
  warning: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#fff',
    marginBottom: 5,
  },
  errorText: {
    color: '#f00',
  },
  successText: {
    color: '#0f0',
  },
  infoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});
