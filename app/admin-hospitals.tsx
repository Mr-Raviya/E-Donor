import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createHospitalAuthAccount, createHospitalProfile, deleteHospitalProfile, linkHospitalUserRecord, listHospitals, updateHospitalProfile } from './services/hospitalService';
import { HospitalProfile } from './types/hospital';

const emailPattern = /^[^\s@]+@[A-Za-z0-9][^\s@]*\.[A-Za-z]{2,}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,12}$/;

const generateRandomPassword = () => {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}';
  const all = `${lower}${upper}${digits}${symbols}`;
  const pick = (chars: string) => chars.charAt(Math.floor(Math.random() * chars.length));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const base = [pick(lower), pick(upper), pick(digits), pick(symbols)];
    while (base.length < 10) {
      base.push(pick(all));
    }
    const candidate = base.sort(() => Math.random() - 0.5).join('');
    if (passwordPattern.test(candidate)) {
      return candidate.slice(0, 12);
    }
  }
  return `Aa1!${Math.random().toString(36).slice(2, 8)}`;
};

export default function AdminHospitals() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HospitalProfile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newHospital, setNewHospital] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    about: '',
  });
  const [generatedPassword, setGeneratedPassword] = useState(generateRandomPassword());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState({ email: '', password: '', name: '' });
  const [copied, setCopied] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const records = await listHospitals();
        setHospitals(records);
      } catch (error) {
        console.error('Failed to load hospitals', error);
        Alert.alert('Error', 'Could not load hospitals from the server.');
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, []);

  useEffect(() => {
    if (showAddModal) {
      setGeneratedPassword(generateRandomPassword());
    }
  }, [showAddModal]);

  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddHospital = async () => {
    if (saving) {
      return;
    }

    const trimmed = {
      name: newHospital.name.trim(),
      email: newHospital.email.trim(),
      phone: newHospital.phone.trim(),
      street: newHospital.street.trim(),
      city: newHospital.city.trim(),
      state: newHospital.state.trim(),
      zipCode: newHospital.zipCode.trim(),
      about: newHospital.about.trim(),
    };

    if (!trimmed.name || !trimmed.email || !trimmed.phone || !trimmed.street || !trimmed.city || !trimmed.state || !trimmed.zipCode || !trimmed.about) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!emailPattern.test(trimmed.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    const passwordToSend = passwordPattern.test(generatedPassword)
      ? generatedPassword
      : generateRandomPassword();

    if (!passwordPattern.test(passwordToSend)) {
      Alert.alert('Error', 'Could not generate a secure password. Please try again.');
      return;
    }

    try {
      setSaving(true);

      const authUserId = await createHospitalAuthAccount({
        email: trimmed.email,
        password: passwordToSend,
        name: trimmed.name,
      });

      const hospital = await createHospitalProfile({
        ...trimmed,
        verified: false,
        authUserId,
      });
      setHospitals((prev) => [hospital, ...prev]);
      setShowAddModal(false);
      setNewHospital({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        about: '',
      });
      setGeneratedPassword(generateRandomPassword());

      if (hospital.id) {
        void linkHospitalUserRecord({
          authUserId,
          hospitalId: hospital.id,
          hospitalName: trimmed.name,
        });
      }

      // Show password popup for admin to copy and share
      setSavedCredentials({
        email: trimmed.email,
        password: passwordToSend,
        name: trimmed.name,
      });
      setCopied(false);
      setShowPasswordModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to add hospital', error);
      Alert.alert('Error', 'Could not save hospital profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyHospital = async (id: string, verified: boolean) => {
    try {
      const updated = await updateHospitalProfile(id, { verified });
      setHospitals((prev) => prev.map((h) => (h.id === id ? updated : h)));
    } catch (error) {
      console.error('Failed to update verification', error);
      Alert.alert('Error', 'Could not update verification status.');
    }
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
          onPress: async () => {
            try {
              await deleteHospitalProfile(id);
              setHospitals((prev) => prev.filter((h) => h.id !== id));
              Alert.alert('Success', 'Hospital deleted successfully');
            } catch (error) {
              console.error('Failed to delete hospital', error);
              Alert.alert('Error', 'Could not delete hospital profile.');
            }
          },
        },
      ]
    );
  };

  const renderHospital = ({ item }: { item: HospitalProfile }) => (
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
          <Text style={styles.metaText}>
            {item.city}, {item.state} · {item.zipCode}
          </Text>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.street}, {item.city}, {item.state} {item.zipCode}
          </Text>
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

      <View style={styles.aboutSection}>
        <Text style={styles.aboutHeading}>About</Text>
        <Text style={styles.aboutText}>{item.about}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleVerifyHospital(item.id!, !item.verified)}
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
    <SafeAreaView style={styles.container} edges={['top']}>
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

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loaderText}>Loading hospitals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHospitals}
          renderItem={renderHospital}
          keyExtractor={(item) => item.id ?? item.name}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="medkit-outline" size={32} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No hospitals yet</Text>
              <Text style={styles.emptySubtitle}>Create a profile to get started.</Text>
            </View>
          }
        />
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Hospital Profile</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={28} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Basic Information</Text>
                <View style={styles.formGroupInline}>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>Hospital Name</Text>
                    <TextInput
                      style={styles.input}
                      value={newHospital.name}
                      onChangeText={(text) => setNewHospital({ ...newHospital, name: text })}
                      placeholder="Enter Hospital Name"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View style={styles.formGroupInline}>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={newHospital.email}
                      onChangeText={(text) => setNewHospital({ ...newHospital, email: text })}
                      placeholder="Enter Email Address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                      style={styles.input}
                      value={newHospital.phone}
                      onChangeText={(text) => setNewHospital({ ...newHospital, phone: text })}
                      placeholder="Enter Phone Number"
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Address</Text>
                <View style={styles.formGroupInline}>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>Street</Text>
                    <TextInput
                      style={styles.input}
                      value={newHospital.street}
                      onChangeText={(text) => setNewHospital({ ...newHospital, street: text })}
                      placeholder="Enter Street Address"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View style={styles.formGroupInline}>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={newHospital.city}
                      onChangeText={(text) => setNewHospital({ ...newHospital, city: text })}
                      placeholder="Enter City"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                      style={styles.input}
                      value={newHospital.state}
                      onChangeText={(text) => setNewHospital({ ...newHospital, state: text })}
                      placeholder="Enter State"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View style={styles.formGroupInline}>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>Zip Code</Text>
                    <TextInput
                      style={styles.input}
                      value={newHospital.zipCode}
                      onChangeText={(text) => setNewHospital({ ...newHospital, zipCode: text })}
                      placeholder="Enter Zip Code"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Portal Access</Text>
                <View style={styles.formGroupInline}>
                  <View style={styles.inlineField}>
                    <Text style={styles.label}>Temporary Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        value={generatedPassword}
                        editable={false}
                        selectTextOnFocus
                      />
                      <TouchableOpacity
                        onPress={() => setGeneratedPassword(generateRandomPassword())}
                        style={styles.regenerateBtn}
                      >
                        <Ionicons name="refresh" size={20} color="#DC143C" />
                        <Text style={styles.regenerateText}>Regenerate</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>
                      Password follows user rules (6-12 chars, upper/lowercase, number, special).
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Description</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>About Hospital</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newHospital.about}
                    onChangeText={(text) => setNewHospital({ ...newHospital, about: text })}
                    placeholder="Share the hospital specialties, facilities, and emergency readiness."
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddHospital} disabled={saving}>
                <LinearGradient colors={['#DC143C', '#8B0000']} style={styles.submitGradient}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Save Profile</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      </Modal>

      {/* Password Success Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.passwordModalOverlay}>
          <View style={styles.passwordModalCard}>
            <View style={styles.passwordModalIconContainer}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>
            <Text style={styles.passwordModalTitle}>Hospital Added!</Text>
            <Text style={styles.passwordModalMessage}>
              Share these credentials with the hospital administrator:
            </Text>
            
            <View style={styles.credentialsContainer}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Email:</Text>
                <Text style={styles.credentialValue}>{savedCredentials.email}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Temporary Password:</Text>
                <View style={styles.passwordDisplayRow}>
                  <Text style={styles.passwordValue}>{savedCredentials.password}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={async () => {
                      await Clipboard.setStringAsync(savedCredentials.password);
                      setCopied(true);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? '#10B981' : '#DC143C'} />
                    <Text style={[styles.copyButtonText, copied && { color: '#10B981' }]}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.passwordModalNote}>
              Please save this password securely. The hospital will need it to log in for the first time.
            </Text>

            <TouchableOpacity
              style={styles.passwordModalButton}
              onPress={() => {
                setShowPasswordModal(false);
                setCopied(false);
              }}
            >
              <Text style={styles.passwordModalButtonText}>Done</Text>
            </TouchableOpacity>
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
    padding: 14,
    backgroundColor: '#f8f7ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ece8ff',
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
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#6b7280',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    color: '#6b7280',
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
  metaText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  verifiedBadge: {
    marginLeft: 8,
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
  aboutSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  aboutHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  aboutText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
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
  sectionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececec',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupInline: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inlineField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffe8ed',
    borderWidth: 1,
    borderColor: '#fcd5dc',
    gap: 6,
  },
  regenerateText: {
    color: '#DC143C',
    fontWeight: '700',
  },
  helperText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 12,
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
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  passwordModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    backgroundColor: 'white',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 15 },
    elevation: 15,
  },
  passwordModalIconContainer: {
    marginBottom: 16,
  },
  passwordModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  passwordModalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  credentialsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  credentialRow: {
    marginBottom: 12,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  credentialValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  passwordDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC143C',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC143C',
  },
  passwordModalNote: {
    fontSize: 12,
    lineHeight: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  passwordModalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  passwordModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
