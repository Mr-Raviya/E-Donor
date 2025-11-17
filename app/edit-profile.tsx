import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from './contexts/AppearanceContext';
import { useLocalization } from './contexts/LocalizationContext';
import { useUser } from './contexts/UserContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { themeMode } = useAppearance();
  const isDark = themeMode === 'dark';
  const { user, updateUser, updateProfilePicture } = useUser();

  // Form state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location);
  const [bloodType, setBloodType] = useState(user.bloodType);
  const [medicalNotes, setMedicalNotes] = useState(user.medicalNotes);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);

  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [discardModalVisible, setDiscardModalVisible] = useState(false);

  // Update local state when user context changes
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setLocation(user.location);
    setBloodType(user.bloodType);
    setMedicalNotes(user.medicalNotes);
    setProfilePicture(user.profilePicture);
  }, [user]);

  const colors = {
    primary: '#DC2626',
    primaryLight: '#FEE2E2',
    backgroundSecondary: isDark ? '#1F2937' : '#F3F4F6',
    cardBackground: isDark ? '#374151' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#4B5563' : '#E5E7EB',
  };

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      setErrorMessage(t('nameRequired'));
      setErrorModalVisible(true);
      return;
    }
    if (!email.trim()) {
      setErrorMessage(t('emailRequired'));
      setErrorModalVisible(true);
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage(t('emailInvalid'));
      setErrorModalVisible(true);
      return;
    }
    if (!phone.trim()) {
      setErrorMessage(t('phoneRequired'));
      setErrorModalVisible(true);
      return;
    }
    if (!bloodType) {
      setErrorMessage(t('bloodTypeRequired'));
      setErrorModalVisible(true);
      return;
    }

    setIsSaving(true);

    try {
      // Update user in context and AsyncStorage
      await updateUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        bloodType,
        medicalNotes: medicalNotes.trim(),
        profilePicture,
      });
      
      setIsSaving(false);
      setSuccessModalVisible(true);
    } catch (error) {
      setIsSaving(false);
      setErrorMessage('Failed to update profile');
      setErrorModalVisible(true);
    }
  };

  const handleCancel = () => {
    setDiscardModalVisible(true);
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMessage('Sorry, we need camera roll permissions to make this work!');
        setErrorModalVisible(true);
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfilePicture(imageUri);
        await updateProfilePicture(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorMessage('Failed to pick image. Please try again.');
      setErrorModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            accessibilityLabel="Cancel"
          >
            <Ionicons name="arrow-back" color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('editProfileTitle')}</Text>
          <Text 
            style={[styles.saveText, isSaving && { opacity: 0.5 }]}
            onPress={isSaving ? undefined : handleSave}
          >
            {isSaving ? '...' : 'Save'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {user.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.avatarLarge}
                />
              ) : (
                <View style={[styles.avatarLarge, { backgroundColor: '#E5E7EB' }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>
                    {name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t('basicInfo')}</Text>
            </View>

            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('fullName')} *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('enterFullName')}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('emailAddress')} *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('enterEmail')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('phoneNumber')} *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('enterPhone')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Location Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('location')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('enterLocation')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Blood Type Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('bloodType')} *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.bloodTypeScroll}
              >
                {bloodTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.bloodTypeButton,
                      bloodType === type && styles.bloodTypeButtonActive,
                    ]}
                    onPress={() => setBloodType(type)}
                  >
                    <Text
                      style={[
                        styles.bloodTypeText,
                        bloodType === type && styles.bloodTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Medical Information */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medkit" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t('medicalInfo')}</Text>
            </View>

              {/* Medical Notes Field */}
              <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('medicalNotes')}</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                  placeholder={t('enterMedicalNotes')}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonLabel}>
              {isSaving ? t('saving') : t('saveChanges')}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setSuccessModalVisible(false);
                router.back();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>{t('success')}</Text>
            <Text style={styles.modalMessage}>{t('profileUpdated')}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSuccessButton]}
              onPress={() => {
                setSuccessModalVisible(false);
                router.back();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.modalPrimaryText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="close-circle" size={48} color="#EF4444" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>{t('validationError')}</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={() => setErrorModalVisible(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.modalPrimaryText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Discard Changes Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={discardModalVisible}
        onRequestClose={() => setDiscardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="warning-outline" size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>{t('discardChanges')}</Text>
            <Text style={styles.modalMessage}>{t('discardMessage')}</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDiscardModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={() => {
                  setDiscardModalVisible(false);
                  router.back();
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>{t('discard')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => {
  const colors = {
    primary: '#DC2626',
    primaryLight: '#FEE2E2',
    backgroundSecondary: isDark ? '#1F2937' : '#F3F4F6',
    cardBackground: isDark ? '#374151' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#4B5563' : '#E5E7EB',
  };
  const baseFontSize = 14;
  
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#000' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#E5E7EB',
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: colors.text,
      fontSize: baseFontSize + 4,
      fontWeight: '600',
    },
    saveText: {
      color: colors.primary,
      fontSize: baseFontSize,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      padding: 20,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 20,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatarLarge: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: baseFontSize + 16,
      fontWeight: '700',
      letterSpacing: 1,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.backgroundSecondary,
    },
    formCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      marginBottom: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: baseFontSize + 2,
      fontWeight: '600',
      color: colors.text,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: baseFontSize,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
      letterSpacing: 0.2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      minHeight: 50,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: baseFontSize + 1,
      color: colors.text,
      paddingVertical: 14,
      fontWeight: '500',
    },
    textAreaWrapper: {
      minHeight: 100,
      alignItems: 'flex-start',
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
    },
    bloodTypeScroll: {
      marginTop: 12,
    },
    bloodTypeButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      marginRight: 10,
      minWidth: 60,
      alignItems: 'center',
    },
    bloodTypeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    bloodTypeText: {
      fontSize: baseFontSize + 1,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.5,
    },
    bloodTypeTextActive: {
      color: '#FFFFFF',
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      marginTop: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonLabel: {
      color: '#FFFFFF',
      fontSize: baseFontSize + 2,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalCard: {
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
    modalCloseButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    modalMessage: {
      fontSize: 15,
      lineHeight: 22,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
    },
    modalButtonRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelButton: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: 'white',
    },
    modalPrimaryButton: {
      backgroundColor: '#DC2626',
      shadowColor: '#DC2626',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    modalSuccessButton: {
      backgroundColor: '#10B981',
      shadowColor: '#10B981',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
      width: '100%',
    },
    modalCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
    },
    modalPrimaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: 'white',
    },
  });
};
