import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BloodStock {
  bloodType: string;
  unitsAvailable: number;
  unitsReserved: number;
  lowStockThreshold: number;
  expiringIn7Days: number;
  lastUpdated: string;
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const initialInventory: BloodStock[] = [
  {
    bloodType: 'A+',
    unitsAvailable: 145,
    unitsReserved: 23,
    lowStockThreshold: 50,
    expiringIn7Days: 8,
    lastUpdated: '2024-11-15',
  },
  {
    bloodType: 'A-',
    unitsAvailable: 42,
    unitsReserved: 7,
    lowStockThreshold: 30,
    expiringIn7Days: 3,
    lastUpdated: '2024-11-15',
  },
  {
    bloodType: 'B+',
    unitsAvailable: 98,
    unitsReserved: 15,
    lowStockThreshold: 40,
    expiringIn7Days: 5,
    lastUpdated: '2024-11-15',
  },
  {
    bloodType: 'B-',
    unitsAvailable: 28,
    unitsReserved: 4,
    lowStockThreshold: 25,
    expiringIn7Days: 2,
    lastUpdated: '2024-11-15',
  },
  {
    bloodType: 'AB+',
    unitsAvailable: 67,
    unitsReserved: 9,
    lowStockThreshold: 35,
    expiringIn7Days: 4,
    lastUpdated: '2024-11-15',
  },
  {
    bloodType: 'AB-',
    unitsAvailable: 19,
    unitsReserved: 2,
    lowStockThreshold: 15,
    expiringIn7Days: 1,
    lastUpdated: '2024-11-15',
  },
  {
    bloodType: 'O+',
    unitsAvailable: 178,
    unitsReserved: 32,
    lowStockThreshold: 60,
    expiringIn7Days: 12,
    lastUpdated: '2024-11-15',
  },
  {
    bloodType: 'O-',
    unitsAvailable: 34,
    unitsReserved: 6,
    lowStockThreshold: 30,
    expiringIn7Days: 2,
    lastUpdated: '2024-11-15',
  },
];

export default function AdminInventory() {
  const router = useRouter();
  const [inventory, setInventory] = useState<BloodStock[]>(initialInventory);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState<BloodStock | null>(null);
  const [updateValue, setUpdateValue] = useState('');

  const totalUnits = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
  const totalReserved = inventory.reduce((sum, item) => sum + item.unitsReserved, 0);
  const lowStockCount = inventory.filter((item) => item.unitsAvailable < item.lowStockThreshold).length;

  const handleUpdateStock = () => {
    if (!selectedBloodType || !updateValue) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    const value = parseInt(updateValue);
    if (isNaN(value)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    setInventory(
      inventory.map((item) =>
        item.bloodType === selectedBloodType.bloodType
          ? {
              ...item,
              unitsAvailable: item.unitsAvailable + value,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : item
      )
    );

    setShowUpdateModal(false);
    setSelectedBloodType(null);
    setUpdateValue('');
    Alert.alert('Success', 'Inventory updated successfully');
  };

  const getStockStatus = (item: BloodStock) => {
    if (item.unitsAvailable < item.lowStockThreshold) {
      return { status: 'Low', color: '#DC2626', bgColor: '#FEE2E2' };
    } else if (item.unitsAvailable < item.lowStockThreshold * 1.5) {
      return { status: 'Medium', color: '#EA580C', bgColor: '#FFF7ED' };
    }
    return { status: 'Good', color: '#059669', bgColor: '#D1FAE5' };
  };

  const renderBloodStock = ({ item }: { item: BloodStock }) => {
    const stockStatus = getStockStatus(item);

    return (
      <View style={styles.stockCard}>
        <View style={styles.stockHeader}>
          <LinearGradient
            colors={['#DC143C', '#8B0000']}
            style={styles.bloodTypeCircle}
          >
            <Ionicons name="water" size={24} color="#fff" />
            <Text style={styles.bloodTypeText}>{item.bloodType}</Text>
          </LinearGradient>

          <View style={styles.stockInfo}>
            <View style={styles.stockMainInfo}>
              <Text style={styles.stockValue}>{item.unitsAvailable}</Text>
              <Text style={styles.stockLabel}>Units Available</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: stockStatus.bgColor }]}>
              <Text style={[styles.statusText, { color: stockStatus.color }]}>
                {stockStatus.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stockDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="lock-closed" size={16} color="#666" />
            <Text style={styles.detailText}>{item.unitsReserved} Reserved</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color="#EA580C" />
            <Text style={styles.detailText}>{item.expiringIn7Days} Expiring Soon</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min((item.unitsAvailable / (item.lowStockThreshold * 2)) * 100, 100)}%`,
                backgroundColor: stockStatus.color,
              },
            ]}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => {
              setSelectedBloodType(item);
              setShowUpdateModal(true);
            }}
          >
            <Ionicons name="add-circle" size={20} color="#4F46E5" />
            <Text style={styles.updateButtonText}>Update Stock</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.lastUpdated}>Last updated: {item.lastUpdated}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Blood Inventory</Text>
        <View style={styles.backButton} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <LinearGradient colors={['#DC143C', '#8B0000']} style={styles.summaryGradient}>
            <Ionicons name="water" size={28} color="#fff" />
            <Text style={styles.summaryValue}>{totalUnits}</Text>
            <Text style={styles.summaryLabel}>Total Units</Text>
          </LinearGradient>
        </View>
        <View style={styles.summaryCard}>
          <LinearGradient colors={['#EA580C', '#C2410C']} style={styles.summaryGradient}>
            <Ionicons name="alert-circle" size={28} color="#fff" />
            <Text style={styles.summaryValue}>{lowStockCount}</Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </LinearGradient>
        </View>
        <View style={styles.summaryCard}>
          <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.summaryGradient}>
            <Ionicons name="lock-closed" size={28} color="#fff" />
            <Text style={styles.summaryValue}>{totalReserved}</Text>
            <Text style={styles.summaryLabel}>Reserved</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Blood Type List */}
      <FlatList
        data={inventory}
        renderItem={renderBloodStock}
        keyExtractor={(item) => item.bloodType}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      {/* Update Modal */}
      <Modal visible={showUpdateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Stock</Text>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            {selectedBloodType && (
              <>
                <View style={styles.selectedBloodType}>
                  <LinearGradient
                    colors={['#DC143C', '#8B0000']}
                    style={styles.selectedBloodCircle}
                  >
                    <Text style={styles.selectedBloodText}>{selectedBloodType.bloodType}</Text>
                  </LinearGradient>
                  <Text style={styles.currentStock}>
                    Current: {selectedBloodType.unitsAvailable} units
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Add/Remove Units</Text>
                  <TextInput
                    style={styles.input}
                    value={updateValue}
                    onChangeText={setUpdateValue}
                    placeholder="Enter +10 or -5"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.hint}>Use + to add units, - to remove units</Text>
                </View>

                <View style={styles.quickActions}>
                  <Text style={styles.quickActionsLabel}>Quick Actions:</Text>
                  <View style={styles.quickButtons}>
                    {['+10', '+20', '+50', '-10'].map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={styles.quickButton}
                        onPress={() => setUpdateValue(value)}
                      >
                        <Text style={styles.quickButtonText}>{value}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleUpdateStock}>
                  <LinearGradient colors={['#DC143C', '#8B0000']} style={styles.submitGradient}>
                    <Text style={styles.submitText}>Update Inventory</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
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
    width: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summarySection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryGradient: {
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  row: {
    gap: 12,
  },
  stockCard: {
    flex: 1,
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
  stockHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bloodTypeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  stockInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stockMainInfo: {
    marginBottom: 8,
  },
  stockValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  stockLabel: {
    fontSize: 11,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  actions: {
    marginBottom: 8,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    gap: 6,
  },
  updateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  lastUpdated: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
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
  selectedBloodType: {
    alignItems: 'center',
    marginBottom: 24,
  },
  selectedBloodCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedBloodText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  currentStock: {
    fontSize: 16,
    color: '#666',
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
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
