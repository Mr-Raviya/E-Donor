import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  deleteDonationRequest,
  DonationRequest,
  listenToDonationRequests,
  updateDonationRequestStatus
} from './services/donationRequestService';

export default function AdminRequests() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | NonNullable<DonationRequest['status']>>('all');
  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DonationRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToDonationRequests(
      (liveRequests) => {
        setRequests(liveRequests);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to load requests', err);
        setError('Unable to load blood requests right now.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredRequests = requests.filter((request) =>
    filterStatus === 'all' || request.status === filterStatus
  );

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: NonNullable<DonationRequest['status']>
  ) => {
    setUpdatingStatus(true);
    try {
      await updateDonationRequestStatus(requestId, newStatus);
      setShowDetailModal(false);
      Alert.alert('Success', `Request ${newStatus} successfully`);
    } catch (err) {
      console.error('Failed to update status', err);
      Alert.alert('Error', 'Could not update request status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getUrgencyColor = (urgency: DonationRequest['urgency']) => {
    switch (urgency) {
      case 'critical':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'urgent':
        return { bg: '#FFF7ED', text: '#EA580C' };
      default:
        return { bg: '#DBEAFE', text: '#2563EB' };
    }
  };

  const getStatusColor = (status: NonNullable<DonationRequest['status']>) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#CA8A04' };
      case 'approved':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'fulfilled':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#FEF3C7', text: '#CA8A04' };
    }
  };

  const formatRequestDate = (request: DonationRequest) => {
    if (request.date) return request.date;
    if (request.createdAt instanceof Date) return request.createdAt.toLocaleDateString();
    return 'N/A';
  };

  const getUnitsNeeded = (request: DonationRequest) => {
    // Keep compatibility with any legacy field naming
    return request.units ?? (request as any).unitsNeeded ?? 0;
  };

  const renderRequest = ({ item }: { item: DonationRequest }) => {
    const urgencyColors = getUrgencyColor(item.urgency);
    const statusColors = getStatusColor(item.status);
    const unitsNeeded = getUnitsNeeded(item);
    const requestDate = formatRequestDate(item);

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
            <Text style={styles.infoText}>{unitsNeeded} units needed</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.infoText}>{requestDate}</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {/* Requests List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="water-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No blood requests</Text>
              <Text style={styles.emptySubtext}>Requests will appear here when hospitals add them.</Text>
            </View>
          }
        />
      )}

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
                      <Text style={styles.detailValue}>{getUnitsNeeded(selectedRequest)} units</Text>
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
                      <Text style={styles.detailValue}>{formatRequestDate(selectedRequest)}</Text>
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
                      <Text style={styles.notesText}>{selectedRequest.notes || 'No notes provided.'}</Text>
                    </View>
                  </View>

                  {selectedRequest.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                        disabled={updatingStatus}
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
                        disabled={updatingStatus}
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
                      disabled={updatingStatus}
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
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setDeleteCandidate(selectedRequest)}
                    disabled={deleting}
                  >
                    <LinearGradient colors={['#DC2626', '#991B1B']} style={styles.actionButtonGradient}>
                      <Ionicons name="trash-outline" size={22} color="#fff" />
                      <Text style={styles.actionButtonText}>Delete Request</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete confirmation */}
      <Modal visible={!!deleteCandidate} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="trash-outline" size={26} color="#DC2626" />
            </View>
            <Text style={styles.confirmTitle}>Delete this blood request?</Text>
            <Text style={styles.confirmMessage}>
              This will remove the request from the app for all users. This action cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setDeleteCandidate(null)}
                disabled={deleting}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, deleting && styles.confirmDeleteDisabled]}
                onPress={async () => {
                  if (!deleteCandidate) return;
                  setDeleting(true);
                  try {
                    await deleteDonationRequest(deleteCandidate.id);
                    setDeleteCandidate(null);
                    setShowDetailModal(false);
                  } catch (err) {
                    console.error('Failed to delete request', err);
                    Alert.alert('Error', 'Could not delete request. Please try again.');
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#fff" />
                    <Text style={styles.confirmDeleteText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  errorText: {
    color: '#DC2626',
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontSize: 13,
    fontWeight: '600',
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
  deleteButton: {
    marginTop: 16,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  confirmDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
  },
  confirmDeleteDisabled: {
    opacity: 0.7,
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
