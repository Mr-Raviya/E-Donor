import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../lib/firebase';
import {
    deleteAdminUserProfile,
    listUserProfiles,
    updateAdminUserProfile,
    upsertUserProfile
} from './services/profileService';
import { UserProfile } from './types/user';

const emailPattern = /^[^\s@]+@[A-Za-z0-9][^\s@]*\.[A-Za-z]{2,}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,12}$/;

type DonorLevel = 'Bronze' | 'Silver' | 'Gold';

const DONOR_LEVEL_COLORS: Record<DonorLevel, { bg: string; text: string; gradient: string[] }> = {
  Bronze: { bg: '#FED7AA', text: '#C2410C', gradient: ['#FB923C', '#EA580C'] },
  Silver: { bg: '#E5E7EB', text: '#374151', gradient: ['#9CA3AF', '#6B7280'] },
  Gold: { bg: '#FEF3C7', text: '#B45309', gradient: ['#FBBF24', '#D97706'] },
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodType: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  donationCount: number;
  donorLevel: DonorLevel;
}

const normalizeProfileToUser = (profile: UserProfile): User => ({
  id: profile.id ?? '',
  name: profile.name || 'Unnamed user',
  email: profile.email || 'N/A',
  phone: profile.phone || 'N/A',
  bloodType: profile.bloodType || 'N/A',
  status: profile.status === 'inactive' ? 'inactive' : 'active',
  joinedDate: profile.joinedDate?.split('T')[0] ?? 'Unknown',
  donationCount: profile.donationCount ?? 0,
  donorLevel: (profile.donorLevel as DonorLevel) || 'Bronze',
});

export default function AdminUsers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingActionUserId, setPendingActionUserId] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  
  // Donor level modal state
  const [showDonorLevelModal, setShowDonorLevelModal] = useState(false);
  const [selectedUserForLevel, setSelectedUserForLevel] = useState<User | null>(null);

  // Add user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    bloodType: 'A+',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState({ email: '', password: '', name: '' });
  const [copied, setCopied] = useState(false);

  // Password validation checks
  const passwordChecks = {
    length: newUser.password.length >= 6 && newUser.password.length <= 12,
    lowercase: /[a-z]/.test(newUser.password),
    uppercase: /[A-Z]/.test(newUser.password),
    number: /\d/.test(newUser.password),
    special: /[^A-Za-z0-9]/.test(newUser.password),
    match: newUser.password === newUser.confirmPassword && newUser.confirmPassword.length > 0,
  };
  const isPasswordValid = passwordPattern.test(newUser.password) && passwordChecks.match;

  const normalizeAndSetUsers = useCallback((profiles: UserProfile[]) => {
    setUsers(
      profiles
        .map((profile) => normalizeProfileToUser(profile))
        .filter((user) => Boolean(user.id)),
    );
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const remoteUsers = await listUserProfiles();
      normalizeAndSetUsers(remoteUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Unable to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [normalizeAndSetUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
  }, [loadUsers]);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!emailPattern.test(newUser.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!isPasswordValid) {
      Alert.alert('Error', 'Please ensure password meets all requirements and passwords match');
      return;
    }

    try {
      setCreatingUser(true);
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email.trim(),
        newUser.password
      );
      
      const userId = userCredential.user.uid;
      
      // Create user profile in Firestore
      const createdUser = await upsertUserProfile(userId, {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        phone: newUser.phone.trim(),
        bloodType: newUser.bloodType,
        status: 'active',
        donationCount: 0,
        joinedDate: new Date().toISOString(),
      });
      
      setUsers((prev) => [...prev, normalizeProfileToUser(createdUser)]);
      setShowAddModal(false);
      
      // Show password success modal
      setSavedCredentials({
        email: newUser.email.trim(),
        password: newUser.password,
        name: newUser.name.trim(),
      });
      setCopied(false);
      setShowPasswordModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setNewUser({ name: '', email: '', phone: '', bloodType: 'A+', password: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Failed to add user:', error);
      let errorMessage = 'Unable to add user. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      setPendingActionUserId(user.id);
      const updatedUser = await updateAdminUserProfile(user.id, { status: nextStatus });
      setUsers((prev) =>
        prev.map((existingUser) =>
          existingUser.id === user.id ? normalizeProfileToUser(updatedUser) : existingUser,
        ),
      );
    } catch (error) {
      console.error('Failed to update user status:', error);
      Alert.alert('Error', 'Unable to update user status. Please try again.');
    } finally {
      setPendingActionUserId(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setPendingActionUserId(userId);
              await deleteAdminUserProfile(userId);
              setUsers((prev) => prev.filter((user) => user.id !== userId));
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Failed to delete user:', error);
              Alert.alert('Error', 'Unable to delete user. Please try again.');
            } finally {
              setPendingActionUserId(null);
            }
          },
        },
      ]
    );
  };

  const openDonorLevelModal = (user: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUserForLevel(user);
    setShowDonorLevelModal(true);
  };

  const handleChangeDonorLevel = async (level: DonorLevel) => {
    if (!selectedUserForLevel) return;
    
    try {
      setPendingActionUserId(selectedUserForLevel.id);
      const updatedUser = await updateAdminUserProfile(selectedUserForLevel.id, { donorLevel: level });
      setUsers((prev) =>
        prev.map((existingUser) =>
          existingUser.id === selectedUserForLevel.id ? normalizeProfileToUser(updatedUser) : existingUser,
        ),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDonorLevelModal(false);
      setSelectedUserForLevel(null);
    } catch (error) {
      console.error('Failed to update donor level:', error);
      Alert.alert('Error', 'Unable to update donor level. Please try again.');
    } finally {
      setPendingActionUserId(null);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const levelColors = DONOR_LEVEL_COLORS[item.donorLevel];
    
    return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <View style={styles.bloodBadge}>
              <Ionicons name="water" size={12} color="#DC143C" />
              <Text style={styles.bloodType}>{item.bloodType}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'active' ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.donorLevelBadge, { backgroundColor: levelColors.bg }]}
              onPress={() => openDonorLevelModal(item)}
            >
              <Ionicons name="ribbon" size={12} color={levelColors.text} />
              <Text style={[styles.donorLevelText, { color: levelColors.text }]}>{item.donorLevel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#DC143C" />
          <Text style={styles.statText}>{item.donationCount} donations</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.statText}>Joined {item.joinedDate}</Text>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            pendingActionUserId === item.id && styles.disabledButton,
          ]}
          onPress={() => handleToggleStatus(item)}
          disabled={pendingActionUserId === item.id}
        >
          <Ionicons
            name={item.status === 'active' ? 'pause-circle' : 'play-circle'}
            size={20}
            color="#4F46E5"
          />
          <Text style={styles.actionText}>
            {item.status === 'active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deleteButton,
            pendingActionUserId === item.id && styles.disabledButton,
          ]}
          onPress={() => handleDeleteUser(item.id)}
          disabled={pendingActionUserId === item.id}
        >
          <Ionicons name="trash" size={20} color="#DC2626" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#DC143C" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.filterButtons}>
          {(['all', 'active', 'inactive'] as const).map((filter) => (
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
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{users.filter((u) => u.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{users.filter((u) => u.status === 'inactive').length}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filteredUsers.length === 0 && styles.emptyListContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#DC143C" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-circle" size={48} color="#999" />
              <Text style={styles.emptyStateTitle}>No users found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your search or add a new user.
              </Text>
            </View>
          }
        />
      )}

      {/* Add User Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New User</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Ionicons name="close" size={28} color="#1a1a1a" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.name}
                      onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                      placeholder="Enter full name"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.email}
                      onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                      placeholder="Enter email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                      style={styles.input}
                      value={newUser.phone}
                      onChangeText={(text) => setNewUser({ ...newUser, phone: text })}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Blood Type</Text>
                    <View style={styles.bloodTypeSelector}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.bloodTypeButton,
                            newUser.bloodType === type && styles.bloodTypeButtonActive,
                          ]}
                          onPress={() => setNewUser({ ...newUser, bloodType: type })}
                        >
                          <Text
                            style={[
                              styles.bloodTypeText,
                              newUser.bloodType === type && styles.bloodTypeTextActive,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        value={newUser.password}
                        onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                        placeholder="Enter password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={22}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        value={newUser.confirmPassword}
                        onChangeText={(text) => setNewUser({ ...newUser, confirmPassword: text })}
                        placeholder="Confirm password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={22}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Requirements */}
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <View style={styles.requirementRow}>
                      <Ionicons
                        name={passwordChecks.length ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={passwordChecks.length ? '#28a745' : '#999'}
                      />
                      <Text style={[styles.requirementText, passwordChecks.length && styles.requirementMet]}>
                        6-12 characters
                      </Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <Ionicons
                        name={passwordChecks.lowercase ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={passwordChecks.lowercase ? '#28a745' : '#999'}
                      />
                      <Text style={[styles.requirementText, passwordChecks.lowercase && styles.requirementMet]}>
                        One lowercase letter
                      </Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <Ionicons
                        name={passwordChecks.uppercase ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={passwordChecks.uppercase ? '#28a745' : '#999'}
                      />
                      <Text style={[styles.requirementText, passwordChecks.uppercase && styles.requirementMet]}>
                        One uppercase letter
                      </Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <Ionicons
                        name={passwordChecks.number ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={passwordChecks.number ? '#28a745' : '#999'}
                      />
                      <Text style={[styles.requirementText, passwordChecks.number && styles.requirementMet]}>
                        One number
                      </Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <Ionicons
                        name={passwordChecks.special ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={passwordChecks.special ? '#28a745' : '#999'}
                      />
                      <Text style={[styles.requirementText, passwordChecks.special && styles.requirementMet]}>
                        One special character
                      </Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <Ionicons
                        name={passwordChecks.match ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={passwordChecks.match ? '#28a745' : '#999'}
                      />
                      <Text style={[styles.requirementText, passwordChecks.match && styles.requirementMet]}>
                        Passwords match
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, (creatingUser || !isPasswordValid) && styles.submitButtonDisabled]}
                    onPress={handleAddUser}
                    disabled={creatingUser || !isPasswordValid}
                  >
                    <LinearGradient colors={['#DC143C', '#8B0000']} style={styles.submitGradient}>
                      {creatingUser ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitText}>Add User</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Password Success Modal */}
      <Modal 
        visible={showPasswordModal} 
        animationType="fade" 
        transparent
        onRequestClose={() => {
          setShowPasswordModal(false);
          setSavedCredentials(null);
          setCopied(false);
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <Ionicons name="checkmark-circle" size={56} color="#10B981" style={{ marginBottom: 16 }} />
            <Text style={styles.successModalTitle}>User Created Successfully!</Text>
            <Text style={styles.successModalMessage}>
              Share these credentials with {savedCredentials?.name}
            </Text>

            <View style={styles.credentialBox}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Email</Text>
                <Text style={styles.credentialValue}>{savedCredentials?.email}</Text>
              </View>
              <View style={styles.credentialDivider} />
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password</Text>
                <Text style={styles.credentialValue}>{savedCredentials?.password}</Text>
              </View>
            </View>

            <View style={styles.successModalButtonRow}>
              <TouchableOpacity
                style={[styles.successModalButton, styles.copyModalButton]}
                onPress={async () => {
                  await Clipboard.setStringAsync(
                    `Email: ${savedCredentials?.email}\nPassword: ${savedCredentials?.password}`
                  );
                  setCopied(true);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.copyModalButtonText}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.successModalButton, styles.doneModalButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setSavedCredentials(null);
                  setCopied(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.doneModalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Donor Level Modal */}
      <Modal
        visible={showDonorLevelModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDonorLevelModal(false)}
      >
        <View style={styles.donorLevelModalOverlay}>
          <View style={styles.donorLevelModalContent}>
            <View style={styles.donorLevelModalHeader}>
              <Text style={styles.donorLevelModalTitle}>Change Donor Level</Text>
              <TouchableOpacity onPress={() => setShowDonorLevelModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedUserForLevel && (
              <Text style={styles.donorLevelModalSubtitle}>
                Select level for {selectedUserForLevel.name}
              </Text>
            )}

            <View style={styles.donorLevelOptions}>
              {(['Bronze', 'Silver', 'Gold'] as DonorLevel[]).map((level) => {
                const colors = DONOR_LEVEL_COLORS[level];
                const isSelected = selectedUserForLevel?.donorLevel === level;
                
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.donorLevelOption,
                      { backgroundColor: colors.bg },
                      isSelected && styles.donorLevelOptionSelected,
                    ]}
                    onPress={() => handleChangeDonorLevel(level)}
                    disabled={pendingActionUserId === selectedUserForLevel?.id}
                  >
                    <LinearGradient
                      colors={colors.gradient}
                      style={styles.donorLevelIconWrapper}
                    >
                      <Ionicons name="ribbon" size={24} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.donorLevelOptionText, { color: colors.text }]}>
                      {level}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.text} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.donorLevelCancelButton}
              onPress={() => setShowDonorLevelModal(false)}
            >
              <Text style={styles.donorLevelCancelText}>Cancel</Text>
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
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
    paddingBottom: 40,
    gap: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  bloodType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC143C',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    gap: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  deleteText: {
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
  bloodTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  bloodTypeButtonActive: {
    backgroundColor: '#FFE0E0',
    borderColor: '#DC143C',
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  bloodTypeTextActive: {
    color: '#DC143C',
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptyStateText: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeIcon: {
    padding: 14,
  },
  passwordRequirements: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#999',
  },
  requirementMet: {
    color: '#28a745',
    fontWeight: '500',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 360,
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
  successModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  credentialBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  credentialDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  credentialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  credentialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  successModalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  successModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  copyModalButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  doneModalButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  copyModalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  doneModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  // Donor Level Badge styles
  donorLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  donorLevelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Donor Level Modal styles
  donorLevelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  donorLevelModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  donorLevelModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  donorLevelModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  donorLevelModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  donorLevelOptions: {
    gap: 12,
  },
  donorLevelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  donorLevelOptionSelected: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  donorLevelIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorLevelOptionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  donorLevelCancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  donorLevelCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
