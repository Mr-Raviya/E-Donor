import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    type KeyboardEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../lib/firebase';
import { useAdmin } from './contexts/AdminContext';
import { useUser } from './contexts/UserContext';

const emailPattern = /^[^\s@]+@[A-Za-z0-9][^\s@]*\.[A-Za-z]{2,}$/;
const sanitizeEmail = (value: string) => value.replace(/[^A-Za-z0-9@.]/g, '');
const sanitizePassword = (value: string) => value.replace(/\s+/g, '');
const RESET_MODAL_OFFSCREEN = Dimensions.get('window').height;

export default function SignInScreen() {
  const router = useRouter();
  const { refreshAdminStatus } = useAdmin();
  const { signInWithPassword, resendVerificationEmail } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'email' | 'password', string>>>(
    {}
  );
  const [signingIn, setSigningIn] = useState(false);
  const [resetError, setResetError] = useState<string | undefined>(undefined);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSentMessage, setVerificationSentMessage] = useState<string | undefined>(
    undefined,
  );
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [resetSuccessVisible, setResetSuccessVisible] = useState(false);
  const signInShake = useRef(new Animated.Value(0)).current;
  const resetShake = useRef(new Animated.Value(0)).current;
  const resetModalTranslate = useRef(new Animated.Value(RESET_MODAL_OFFSCREEN)).current;

  const triggerShake = (value: Animated.Value) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    value.setValue(0);
    Animated.sequence([
      Animated.timing(value, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(value, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(value, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(value, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const clearFieldError = (field: 'email' | 'password') => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();
    if (signingIn) {
      return;
    }
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const nextErrors: Partial<Record<'email' | 'password', string>> = {};

    if (!trimmedEmail) {
      nextErrors.email = 'Please enter your email.';
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!trimmedPassword) {
      nextErrors.password = 'Please enter your password.';
    }

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      triggerShake(signInShake);
      return;
    }

    setErrors({});
    setErrorModalVisible(false);
    setVerificationSentMessage(undefined);
    setErrorCode(undefined);
    setSigningIn(true);

    try {
      await signInWithPassword(trimmedEmail, trimmedPassword);
      const isAdmin = await refreshAdminStatus();
      setSigningIn(false);
      router.replace(isAdmin ? '/admin-dashboard' : '/home');
    } catch (error: any) {
      setSigningIn(false);
      // Check for specific error messages
      const errorCode = error?.code;
      const errorMsg = error?.message || '';
      const normalizedMessage = errorMsg.toLowerCase();
        setErrorCode(errorCode);
      if (errorCode === 'auth/network-request-failed' || normalizedMessage.includes('network request failed')) {
        setErrorMessage('Please check your internet connection and try again.');
      } else if (errorCode === 'auth/email-not-verified' || normalizedMessage.includes('verify your email')) {
        setErrorMessage(
          'Please verify your email to continue. We just sent a verification link to your inbox.',
        );
      } else if (normalizedMessage.includes('deactivated')) {
        setErrorMessage('Your account has been deactivated. Please contact support for assistance.');
      } else if (
        normalizedMessage.includes('invalid-credential') ||
        normalizedMessage.includes('wrong-password') ||
        normalizedMessage.includes('user-not-found')
      ) {
        setErrorMessage('Email or password is incorrect. Please try again.');
      } else {
        setErrorMessage('Unable to sign in. Please check your credentials and try again.');
      }
      setErrorModalVisible(true);
    }
  };

  const handleResendVerification = async () => {
    if (resendingVerification || verificationCooldown > 0 || !email || !password) {
      if (verificationCooldown > 0) {
        setVerificationSentMessage(`Please wait ${verificationCooldown}s before resending.`);
      }
      return;
    }
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    setResendingVerification(true);
    setVerificationSentMessage(undefined);
    
    try {
      await resendVerificationEmail(trimmedEmail, trimmedPassword);
      setVerificationSentMessage('Verification link resent. Please check your inbox.');
      setVerificationCooldown(60);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (resendError) {
      console.error('Failed to resend verification email:', resendError);
      setVerificationSentMessage('Unable to resend verification email. Please try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setResendingVerification(false);
    }
  };

  const handleResetLink = async () => {
    if (resetSubmitting) {
      return;
    }
    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      setResetError('Please enter your email.');
      triggerShake(resetShake);
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setResetError('Please enter a valid email address.');
      triggerShake(resetShake);
      return;
    }
    setResetError(undefined);
    setResetSubmitting(true);
    
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResetSubmitting(false);
      // Close forgot modal and show success modal after animation completes
      Keyboard.dismiss();
      setResetError(undefined);
      Animated.timing(resetModalTranslate, {
        toValue: RESET_MODAL_OFFSCREEN,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setForgotVisible(false);
          setKeyboardVisible(false);
          resetModalTranslate.setValue(RESET_MODAL_OFFSCREEN);
          // Show success modal after forgot modal is closed
          setResetSuccessVisible(true);
        }
      });
    } catch (error: any) {
      setResetSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMsg = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many attempts. Please try again later.';
      }
      
      setResetError(errorMsg);
      triggerShake(resetShake);
    }
  };

  const openForgotModal = useCallback(() => {
    resetModalTranslate.setValue(RESET_MODAL_OFFSCREEN);
    setResetEmail(email);
    setResetError(undefined);
    setForgotVisible(true);
  }, [email, resetModalTranslate]);

  const closeForgotModal = useCallback(() => {
    Keyboard.dismiss();
    setResetSubmitting(false);
    setResetError(undefined);
    Animated.timing(resetModalTranslate, {
      toValue: RESET_MODAL_OFFSCREEN,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }
      setForgotVisible(false);
      setKeyboardVisible(false);
      resetModalTranslate.setValue(RESET_MODAL_OFFSCREEN);
    });
  }, [resetModalTranslate]);

  const closeErrorModal = useCallback(() => {
    setErrorModalVisible(false);
    setVerificationSentMessage(undefined);
    setErrorCode(undefined);
    setVerificationCooldown(0);
  }, []);

  useEffect(() => {
    if (verificationCooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setVerificationCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verificationCooldown]);

  const resetModalPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          gestureState.dy > 6 && Math.abs(gestureState.dx) < 20,
        onPanResponderGrant: () => {
          resetModalTranslate.stopAnimation();
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (gestureState.dy < 0) {
            resetModalTranslate.setValue(gestureState.dy * 0.25);
            return;
          }
          resetModalTranslate.setValue(
            Math.min(RESET_MODAL_OFFSCREEN, gestureState.dy)
          );
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const shouldClose = gestureState.dy > 140 || gestureState.vy > 1.1;
          if (shouldClose) {
            closeForgotModal();
            return;
          }
          Animated.timing(resetModalTranslate, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.timing(resetModalTranslate, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        },
      }),
    [closeForgotModal, resetModalTranslate]
  );

  useEffect(() => {
    if (!forgotVisible) {
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (_event: KeyboardEvent) => {
      setKeyboardVisible(true);
    };

    const handleHide = () => {
      setKeyboardVisible(false);
    };

    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [forgotVisible]);

  useEffect(() => {
    if (!forgotVisible) {
      return;
    }

    Animated.timing(resetModalTranslate, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [forgotVisible, resetModalTranslate]);
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding')}
            accessibilityLabel="Go back"
            style={styles.backButton}
            activeOpacity={0.7}
          >
              <Ionicons name="chevron-back" size={26} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.title}>Welcome to E-Donor</Text>
            <Text style={styles.subtitle}>Sign in to continue saving lives</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputRow, errors.email ? styles.inputRowError : null]}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(value) => {
                  const sanitized = sanitizeEmail(value);
                  setEmail(sanitized);
                  if (errors.email) {
                    clearFieldError('email');
                  }
                }}
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
            <View style={[styles.inputRow, errors.password ? styles.inputRowError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={secureEntry}
                value={password}
                onChangeText={(value) => {
                  const sanitized = sanitizePassword(value);
                  setPassword(sanitized);
                  if (errors.password) {
                    clearFieldError('password');
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => setSecureEntry((prev) => !prev)}
                accessibilityLabel={secureEntry ? 'Show password' : 'Hide password'}
              >
                <Ionicons
                  name={secureEntry ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <TouchableOpacity
              style={styles.forgotButton}
              activeOpacity={0.7}
              onPress={openForgotModal}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Animated.View
              style={[styles.buttonWrapper, { transform: [{ translateX: signInShake }] }]}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPress={handleSignIn}
                disabled={signingIn}
              >
                {signingIn ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.footerPrompt}>
            <Text style={styles.promptText}>No account yet?</Text>
            <TouchableOpacity onPress={() => router.push('/sign-up')} activeOpacity={0.7}>
              <Text style={styles.linkText}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent
          visible={errorModalVisible}
          onRequestClose={closeErrorModal}
        >
          <View style={styles.authErrorOverlay}>
            <View style={styles.authErrorCard}>
              <Ionicons name="alert-circle" size={40} color="#DC2626" style={{ marginBottom: 12 }} />
              <Text style={styles.authErrorTitle}>Authentication Failed</Text>
              <Text style={styles.authErrorMessage}>{errorMessage}</Text>
              {errorCode === 'auth/email-not-verified' ? (
                <>
                  {verificationSentMessage ? (
                    <Text style={styles.authInfoMessage}>{verificationSentMessage}</Text>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.authErrorButton, styles.authSecondaryButton]}
                    onPress={handleResendVerification}
                    activeOpacity={0.9}
                    disabled={resendingVerification || verificationCooldown > 0}
                  >
                    {resendingVerification ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.authSecondaryButtonText}>
                        {verificationCooldown > 0
                          ? `Resend in ${verificationCooldown}s`
                          : 'Resend Verification Email'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.authErrorButton}
                  onPress={closeErrorModal}
                  activeOpacity={0.9}
                >
                  <Text style={styles.authErrorButtonText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={forgotVisible}
          onRequestClose={closeForgotModal}
        >
          <View style={styles.modalRoot}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <Pressable style={StyleSheet.absoluteFill} onPress={closeForgotModal} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
              style={[
                styles.modalContainer,
                keyboardVisible ? styles.modalContainerShifted : null,
                { paddingBottom: keyboardVisible ? 24 : 0 },
              ]}
            >
              <Animated.View
                style={[styles.modalCard, { transform: [{ translateY: resetModalTranslate }] }]}
                {...resetModalPanResponder.panHandlers}
              >
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your email address and we will send you a link to reset your password.
                </Text>

                <Text style={styles.modalLabel}>Email Address</Text>
                <View style={[styles.modalInputRow, resetError ? styles.modalInputRowError : null]}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={(value) => {
                      const sanitized = sanitizeEmail(value);
                      setResetEmail(sanitized);
                      if (resetError) {
                        setResetError(undefined);
                      }
                    }}
                  />
                </View>
                {resetError ? <Text style={styles.modalErrorText}>{resetError}</Text> : null}

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    activeOpacity={0.8}
                    onPress={closeForgotModal}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Animated.View
                    style={[styles.modalButtonWrapper, { transform: [{ translateX: resetShake }] }]}
                  >
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalPrimaryButton]}
                      activeOpacity={0.9}
                      onPress={handleResetLink}
                      disabled={resetSubmitting}
                    >
                      {resetSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalPrimaryText}>Get Reset Link</Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Password Reset Success Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={resetSuccessVisible}
          onRequestClose={() => setResetSuccessVisible(false)}
        >
          <View style={styles.resetSuccessOverlay}>
            <View style={styles.resetSuccessCard}>
              <View style={styles.resetSuccessIconContainer}>
                <Ionicons name="checkmark-circle" size={56} color="#10B981" />
              </View>
              <Text style={styles.resetSuccessTitle}>Success!</Text>
              <Text style={styles.resetSuccessMessage}>
                Password reset link has been sent to your email. Please check your inbox.
              </Text>
              <TouchableOpacity
                style={styles.resetSuccessButton}
                onPress={() => setResetSuccessVisible(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.resetSuccessButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    marginTop: 8,
    marginBottom: 24,
    paddingLeft: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  authErrorOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 24,
  },
  authErrorCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  authErrorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  authErrorMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  authInfoMessage: {
    fontSize: 13,
    color: '#16A34A',
    textAlign: 'center',
    marginBottom: 12,
  },
  authErrorButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  authErrorButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  authSecondaryButton: {
    backgroundColor: '#DC2626',
    marginBottom: 10,
    shadowOpacity: 0.3,
    shadowColor: '#DC2626',
  },
  authSecondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00000020',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  passwordLabel: {
    marginTop: 16,
  },
  inputRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputRowError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 14,
    marginBottom: -6,
    fontSize: 12,
    color: '#DC2626',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  buttonWrapper: {
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  footerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  promptText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainerShifted: {
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    backgroundColor: 'white',
    padding: 28,
    gap: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 15 },
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  modalInputRowError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  modalTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  modalErrorText: {
    marginTop: -12,
    marginBottom: 4,
    marginLeft: 14,
    fontSize: 12,
    color: '#DC2626',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonWrapper: {
    flex: 1,
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
  resetSuccessOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resetSuccessCard: {
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
  resetSuccessIconContainer: {
    marginBottom: 20,
  },
  resetSuccessTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  resetSuccessMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetSuccessButton: {
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
  resetSuccessButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
