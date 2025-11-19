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
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BloodRequest {
  id: string;
  patientName: string;
  bloodType: string;
  unitsNeeded: number;
  urgency: 'critical' | 'urgent' | 'normal';
  hospital: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  contactPerson: string;
  contactNumber: string;
  notes: string;
}

const initialRequests: BloodRequest[] = [
  {
    id: '1',
    patientName: 'Dilshan Amarasinghe',
    bloodType: 'O+',
    unitsNeeded: 3,
    urgency: 'critical',
    hospital: 'National Hospital of Sri Lanka',
    requestDate: '2024-11-16',
    status: 'pending',
    contactPerson: 'Dr. Priyantha Rathnayake',
    contactNumber: '+94 11 269 1111',
    notes: 'Emergency surgery required',
  },
  {
    id: '2',
    patientName: 'Tharaka Wijesekara',
    bloodType: 'A+',
    unitsNeeded: 2,
    urgency: 'urgent',
    hospital: 'Lanka Hospitals',
    requestDate: '2024-11-16',
    status: 'approved',
    contactPerson: 'Dr. Samanthi Jayawardena',
    contactNumber: '+94 11 543 4000',
    notes: 'Scheduled for tomorrow morning',
  },
  {
    id: '3',
    patientName: 'Nadeeka Bandara',
    bloodType: 'B+',
    unitsNeeded: 1,
    urgency: 'normal',
    hospital: 'Asiri Central Hospital',
    requestDate: '2024-11-15',
    status: 'fulfilled',
    contactPerson: 'Nurse Kumari',
    contactNumber: '+94 11 466 5500',
    notes: 'Routine transfusion',
  },
];

export default function AdminRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<'all' | BloodRequest['status']>('all');
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredRequests = requests.filter((request) =>
    filterStatus === 'all' || request.status === filterStatus
  );

  const handleUpdateStatus = (requestId: string, newStatus: BloodRequest['status']) => {
    setRequests(
      requests.map((request) =>
        request.id === requestId ? { ...request, status: newStatus } : request
      )
    );
    setShowDetailModal(false);
    Alert.alert('Success', `Request ${newStatus} successfully`);
  };

  const getUrgencyColor = (urgency: BloodRequest['urgency']) => {
    switch (urgency) {
      case 'critical':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'urgent':
        return { bg: '#FFF7ED', text: '#EA580C' };
      default:
        return { bg: '#DBEAFE', text: '#2563EB' };
    }
  };

  const getStatusColor = (status: BloodRequest['status']) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#CA8A04' };
      case 'approved':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'fulfilled':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#DC2626' };
    }
  };

  const renderRequest = ({ item }: { item: BloodRequest }) => {
    const urgencyColors = getUrgencyColor(item.urgency);
    const statusColors = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => {
          setSelectedRequest(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.requestHeader}>
          <View style={styles.bloodTypeBox}>
            <Ionicons name="water" size={20} color="#DC143C" />
            <Text style={styles.bloodTypeText}>{item.bloodType}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors.bg }]}>
            <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
              {item.urgency.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.hospital}>
          <Ionicons name="medical" size={14} color="#666" /> {item.hospital}
        </Text>

        <View style={styles.requestInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="fitness" size={16} color="#666" />
            <Text style={styles.infoText}>{item.unitsNeeded} units needed</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.infoText}>{item.requestDate}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Blood Requests</Text>
        <View style={styles.backButton} />
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{requests.filter((r) => r.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{requests.filter((r) => r.urgency === 'critical').length}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{requests.filter((r) => r.status === 'fulfilled').length}</Text>
          <Text style={styles.statLabel}>Fulfilled</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {(['all', 'pending', 'approved', 'fulfilled', 'rejected'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, filterStatus === filter && styles.filterButtonActive]}
                onPress={() => setFilterStatus(filter)}
              >
                <Text style={[styles.filterText, filterStatus === filter && styles.filterTextActive]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Requests List */}
      <FlatList
        data={filteredRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Request Details</Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={28} color="#1a1a1a" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailSection}>
                    <LinearGradient
                      colors={['#DC143C', '#8B0000']}
                      style={styles.bloodTypeCircle}
                    >
                      <Ionicons name="water" size={32} color="#fff" />
                      <Text style={styles.bloodTypeCircleText}>{selectedRequest.bloodType}</Text>
                    </LinearGradient>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Patient Name</Text>
                      <Text style={styles.detailValue}>{selectedRequest.patientName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hospital</Text>
                      <Text style={styles.detailValue}>{selectedRequest.hospital}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Units Needed</Text>
                      <Text style={styles.detailValue}>{selectedRequest.unitsNeeded} units</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Contact Person</Text>
                      <Text style={styles.detailValue}>{selectedRequest.contactPerson}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Contact Number</Text>
                      <Text style={styles.detailValue}>{selectedRequest.contactNumber}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Request Date</Text>
                      <Text style={styles.detailValue}>{selectedRequest.requestDate}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Urgency</Text>
                      <View
                        style={[
                          styles.urgencyBadge,
                          { backgroundColor: getUrgencyColor(selectedRequest.urgency).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.urgencyText,
                            { color: getUrgencyColor(selectedRequest.urgency).text },
                          ]}
                        >
                          {selectedRequest.urgency.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(selectedRequest.status).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(selectedRequest.status).text },
                          ]}
                        >
                          {selectedRequest.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.notesSection}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.notesText}>{selectedRequest.notes}</Text>
                    </View>
                  </View>

                  {selectedRequest.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                      >
                        <LinearGradient
                          colors={['#059669', '#047857']}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="checkmark-circle" size={24} color="#fff" />
                          <Text style={styles.actionButtonText}>Approve</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                      >
                        <LinearGradient
                          colors={['#DC2626', '#991B1B']}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="close-circle" size={24} color="#fff" />
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedRequest.status === 'approved' && (
                    <TouchableOpacity
                      style={styles.fulfillButton}
                      onPress={() => handleUpdateStatus(selectedRequest.id, 'fulfilled')}
                    >
                      <LinearGradient
                        colors={['#2563EB', '#1D4ED8']}
                        style={styles.actionButtonGradient}
                      >
                        <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Mark as Fulfilled</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </ScrollView>
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
  filterSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#DC143C',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bloodTypeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  bloodTypeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC143C',
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  hospital: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
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
  detailSection: {
    gap: 16,
  },
  bloodTypeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  bloodTypeCircleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notesSection: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  approveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fulfillButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
