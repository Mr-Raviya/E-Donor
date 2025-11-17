import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  capacity: number;
  available: number;
  verified: boolean;
  rating: number;
}

const initialHospitals: Hospital[] = [
  {
    id: '1',
    name: 'City General Hospital',
    address: '123 Main St, Downtown',
    phone: '+1 234 567 8900',
    email: 'contact@citygeneral.com',
    capacity: 500,
    available: 320,
    verified: true,
    rating: 4.5,
  },
  {
    id: '2',
    name: 'St. Mary Medical Center',
    address: '456 Oak Ave, Westside',
    phone: '+1 234 567 8901',
    email: 'info@stmary.com',
    capacity: 350,
    available: 280,
    verified: true,
    rating: 4.8,
  },
];

export default function AdminHospitals() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>(initialHospitals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newHospital, setNewHospital] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    capacity: '',
  });

  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddHospital = () => {
    if (!newHospital.name || !newHospital.address || !newHospital.phone || !newHospital.email || !newHospital.capacity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const hospital: Hospital = {
      id: Date.now().toString(),
      ...newHospital,
      capacity: parseInt(newHospital.capacity),
      available: parseInt(newHospital.capacity),
      verified: false,
      rating: 0,
    };

    setHospitals([...hospitals, hospital]);
    setShowAddModal(false);
    setNewHospital({ name: '', address: '', phone: '', email: '', capacity: '' });
    Alert.alert('Success', 'Hospital added successfully');
  };

  const handleVerifyHospital = (id: string) => {
    setHospitals(
      hospitals.map((h) =>
        h.id === id ? { ...h, verified: !h.verified } : h
      )
    );
  };

  const handleDeleteHospital = (id: string) => {
    Alert.alert(
      'Delete Hospital',
      'Are you sure you want to delete this hospital?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHospitals(hospitals.filter((h) => h.id !== id));
            Alert.alert('Success', 'Hospital deleted successfully');
          },
        },
      ]
    );
  };

  const renderHospital = ({ item }: { item: Hospital }) => (
    <View style={styles.hospitalCard}>
      <View style={styles.hospitalHeader}>
        <View style={styles.hospitalIcon}>
          <Ionicons name="medical" size={32} color="#DC143C" />
        </View>
        <View style={styles.hospitalInfo}>
          <View style={styles.hospitalTitleRow}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.floor(item.rating) ? 'star' : 'star-outline'}
                size={14}
                color="#FFA500"
              />
            ))}
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#666" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="mail" size={16} color="#666" />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
      </View>

      <View style={styles.capacitySection}>
        <View style={styles.capacityInfo}>
          <Text style={styles.capacityLabel}>Capacity</Text>
          <Text style={styles.capacityValue}>{item.capacity}</Text>
        </View>
        <View style={styles.capacityInfo}>
          <Text style={styles.capacityLabel}>Available</Text>
          <Text style={[styles.capacityValue, styles.availableValue]}>{item.available}</Text>
        </View>
        <View style={styles.capacityBar}>
          <View
            style={[
              styles.capacityFill,
              { width: `${(item.available / item.capacity) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleVerifyHospital(item.id)}
        >
          <Ionicons
            name={item.verified ? 'close-circle' : 'checkmark-circle'}
            size={20}
            color={item.verified ? '#EA580C' : '#059669'}
          />
          <Text style={[styles.actionBtnText, { color: item.verified ? '#EA580C' : '#059669' }]}>
            {item.verified ? 'Unverify' : 'Verify'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeleteHospital(item.id)}
        >
          <Ionicons name="trash" size={20} color="#DC2626" />
          <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Hospital Management</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#DC143C" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{hospitals.length}</Text>
          <Text style={styles.statLabel}>Total Hospitals</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{hospitals.filter((h) => h.verified).length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
      </View>

      <FlatList
        data={filteredHospitals}
        renderItem={renderHospital}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Hospital</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Hospital Name</Text>
                <TextInput
                  style={styles.input}
                  value={newHospital.name}
                  onChangeText={(text) => setNewHospital({ ...newHospital, name: text })}
                  placeholder="Enter hospital name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newHospital.address}
                  onChangeText={(text) => setNewHospital({ ...newHospital, address: text })}
                  placeholder="Enter full address"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={newHospital.phone}
                  onChangeText={(text) => setNewHospital({ ...newHospital, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newHospital.email}
                  onChangeText={(text) => setNewHospital({ ...newHospital, email: text })}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bed Capacity</Text>
                <TextInput
                  style={styles.input}
                  value={newHospital.capacity}
                  onChangeText={(text) => setNewHospital({ ...newHospital, capacity: text })}
                  placeholder="Enter total bed capacity"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddHospital}>
                <LinearGradient colors={['#DC143C', '#8B0000']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Add Hospital</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    padding: 4,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  statsBar: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC143C',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 20,
  },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hospitalHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  hospitalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  hospitalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailsSection: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  capacitySection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  capacityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 14,
    color: '#666',
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  availableValue: {
    color: '#059669',
  },
  capacityBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    backgroundColor: '#059669',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtnText: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
