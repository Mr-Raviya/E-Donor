import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Keyboard,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from './contexts/UserContext';

const emailPattern = /^[^\s@]+@[A-Za-z0-9][^\s@]*\.[A-Za-z]{2,}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,12}$/;

const sanitizeName = (value: string) => value.replace(/[^A-Za-z]/g, '');
const sanitizeEmail = (value: string) => value.replace(/[^A-Za-z0-9@.]/g, '');
const sanitizeCity = (value: string) => value.replace(/[^A-Za-z]/g, '');
const sanitizePhone = (value: string) => value.replace(/[^0-9]/g, '');
const sanitizeBirthday = (value: string) => value.replace(/[^0-9]/g, '');
const sanitizePassword = (value: string) => value.replace(/\s+/g, '');

const formatPhoneNumber = (digits: string) => {
  if (!digits) {
    return '';
  }
  const first = digits.slice(0, 3);
  const middle = digits.slice(3, 6);
  const last = digits.slice(6, 10);

  if (digits.length <= 3) {
    return first;
  }
  if (digits.length <= 6) {
    return `${first} ${middle}`.trim();
  }
  return `${first} ${middle} ${last}`.trim();
};

const formatProperName = (value: string) => {
  const sanitized = sanitizeName(value);
  if (!sanitized) {
    return '';
  }
  const lower = sanitized.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const STEP_COUNT = 8;
const allowedPhonePrefixes = ['070', '071', '072', '074', '075', '076', '077', '078'];
const birthdayPattern = /^\d{2}-\d{2}-\d{4}$/;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUpWithPassword, updateUser } = useUser();
  const insets = useSafeAreaInsets();
  const [secureEntry, setSecureEntry] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const bloodTypes = useMemo(
    () => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    []
  );
  const [bloodTypeOpen, setBloodTypeOpen] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<
      Record<
        |
          'firstName'
          | 'lastName'
          | 'email'
          | 'city'
          | 'phone'
          | 'bloodType'
          | 'birthday'
          | 'password',
        string
      >
    >
  >({});
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const createAccountShake = useRef(new Animated.Value(0)).current;
  const nextButtonShake = useRef(new Animated.Value(0)).current;
  const stepsTranslate = useRef(new Animated.Value(0)).current;
  const [currentStep, setCurrentStep] = useState(0);
  const bloodTypeAnim = useRef(new Animated.Value(0)).current;

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

  const clearFieldError = (
    field:
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'city'
      | 'phone'
      | 'bloodType'
      | 'birthday'
      | 'password'
  ) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const animateToStep = useCallback(
    (step: number) => {
      const target = Math.min(Math.max(step, 0), STEP_COUNT - 1);
      setCurrentStep(target);
      bloodTypeAnim.stopAnimation();
      bloodTypeAnim.setValue(0);
      setBloodTypeOpen(false);
      Animated.spring(stepsTranslate, {
        toValue: -target * SCREEN_WIDTH,
        useNativeDriver: true,
        stiffness: 220,
        damping: 26,
        mass: 1,
      }).start();
    },
    [bloodTypeAnim, stepsTranslate]
  );

  const validateStep = useCallback(
    (step: number) => {
      const stepErrors: Partial<
        Record<
        'firstName' | 'lastName' | 'email' | 'city' | 'phone' | 'bloodType' | 'birthday' | 'password',
        string
      >
      > = {};
      const fieldsToClear: (
        | 'firstName'
        | 'lastName'
        | 'email'
        | 'city'
        | 'phone'
        | 'bloodType'
        | 'birthday'
        | 'password'
      )[] = [];

      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedEmail = email.trim();
      const normalizedPhone = phone.replace(/\s+/g, '').trim();
      const trimmedCity = city.trim();
      const trimmedBirthday = birthday.trim();
      const trimmedPassword = password.trim();

      switch (step) {
        case 0:
          fieldsToClear.push('firstName');
          if (!trimmedFirstName) {
            stepErrors.firstName = 'Please enter your first name.';
          }
          break;
        case 1:
          fieldsToClear.push('lastName');
          if (!trimmedLastName) {
            stepErrors.lastName = 'Please enter your last name.';
          }
          break;
        case 2:
          fieldsToClear.push('email');
          if (!trimmedEmail) {
            stepErrors.email = 'Please enter your email.';
          } else if (!emailPattern.test(trimmedEmail)) {
            stepErrors.email = 'Please enter a valid email address.';
          }
          break;
        case 3:
          fieldsToClear.push('city');
          if (!trimmedCity) {
            stepErrors.city = 'Please enter your living city.';
          }
          break;
        case 4:
          fieldsToClear.push('phone');
          if (!normalizedPhone) {
            stepErrors.phone = 'Please enter your phone number.';
          } else if (
            normalizedPhone.length !== 10 ||
            !allowedPhonePrefixes.some((prefix) => normalizedPhone.startsWith(prefix))
          ) {
            stepErrors.phone = 'Enter valid phone number (07x xxx xxxx).';
          }
          break;
        case 5:
          fieldsToClear.push('bloodType');
          if (!selectedBloodType) {
            stepErrors.bloodType = 'Please choose your blood type.';
          }
          break;
        case 6:
          fieldsToClear.push('birthday');
          if (!trimmedBirthday) {
            stepErrors.birthday = 'Please enter your birthday (DD-MM-YYYY).';
          } else if (!birthdayPattern.test(trimmedBirthday)) {
            stepErrors.birthday = 'Birthday must be in DD-MM-YYYY format.';
          } else {
            const [dayStr, monthStr, yearStr] = trimmedBirthday.split('-');
            const day = Number(dayStr);
            const month = Number(monthStr);
            const year = Number(yearStr);
            if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
              stepErrors.birthday = 'Birthday must be a valid calendar date.';
            } else if (day < 1 || day > 31) {
              stepErrors.birthday = 'Day must be between 01 and 31.';
            } else if (month < 1 || month > 12) {
              stepErrors.birthday = 'Month must be between 01 and 12.';
            } else {
              const candidateDate = new Date(year, month - 1, day);
              if (
                candidateDate.getFullYear() !== year ||
                candidateDate.getMonth() !== month - 1 ||
                candidateDate.getDate() !== day
              ) {
                stepErrors.birthday = 'Birthday must be a valid calendar date.';
              } else {
                const today = new Date();
                const minimumBirthDate = new Date(
                  today.getFullYear() - 16,
                  today.getMonth(),
                  today.getDate()
                );
                const maximumBirthDate = new Date(
                  today.getFullYear() - 130,
                  today.getMonth(),
                  today.getDate()
                );
                if (candidateDate < maximumBirthDate) {
                  stepErrors.birthday = 'Birthday must be a valid calendar date.';
                } else if (candidateDate > minimumBirthDate) {
                  stepErrors.birthday = 'You must be at least 16 years old to register.';
                }
              }
            }
          }
          break;
        case 7:
          fieldsToClear.push('password');
          if (!trimmedPassword) {
            stepErrors.password = 'Please enter your password.';
          } else if (!passwordPattern.test(trimmedPassword)) {
            stepErrors.password =
              'Password must be 6-12 characters and include uppercase, lowercase, number and symbol.';
          }
          break;
        default:
          break;
      }

      if (Object.keys(stepErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...stepErrors }));
        return false;
      }

      if (fieldsToClear.length > 0) {
        setErrors((prev) => {
          let next = prev;
          fieldsToClear.forEach((field) => {
            if (next[field]) {
              if (next === prev) {
                next = { ...prev };
              }
              delete next[field];
            }
          });
          return next;
        });
      }

      return true;
    },
    [birthday, city, email, firstName, lastName, password, phone, selectedBloodType]
  );

  const handleNextStep = () => {
    Keyboard.dismiss();
    if (currentStep >= STEP_COUNT - 1) {
      return;
    }
    if (!validateStep(currentStep)) {
      triggerShake(nextButtonShake);
      return;
    }
    animateToStep(currentStep + 1);
  };

  const stepPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 12,
        onPanResponderGrant: () => {
          stepsTranslate.stopAnimation();
        },
        onPanResponderMove: (_evt, gestureState) => {
          const base = -currentStep * SCREEN_WIDTH;
          let next = base + gestureState.dx;
          if (currentStep === 0 && gestureState.dx > 0) {
            next = base + gestureState.dx * 0.2;
          }
          if (currentStep === STEP_COUNT - 1 && gestureState.dx < 0) {
            next = base + gestureState.dx * 0.2;
          }
          stepsTranslate.setValue(next);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const { dx, vx } = gestureState;
          if ((dx < -80 || vx < -0.5) && currentStep < STEP_COUNT - 1) {
            if (validateStep(currentStep)) {
              Keyboard.dismiss();
              animateToStep(currentStep + 1);
            } else {
              triggerShake(nextButtonShake);
              animateToStep(currentStep);
            }
            return;
          }
          if ((dx > 80 || vx > 0.5) && currentStep > 0) {
            Keyboard.dismiss();
            animateToStep(currentStep - 1);
            return;
          }
          animateToStep(currentStep);
        },
        onPanResponderTerminate: () => {
          animateToStep(currentStep);
        },
      }),
    [animateToStep, currentStep, nextButtonShake, stepsTranslate, validateStep]
  );

  const handleCreateAccount = async () => {
    Keyboard.dismiss();
    closeBloodTypeDropdown();
    if (creatingAccount) {
      return;
    }

    for (let step = 0; step < STEP_COUNT; step += 1) {
      if (!validateStep(step)) {
        triggerShake(createAccountShake);
        animateToStep(step);
        return;
      }
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.replace(/\s+/g, '').trim();
    const trimmedCity = city.trim();

    setCreatingAccount(true);
    try {
      await signUpWithPassword(
        trimmedEmail,
        trimmedPassword,
        `${trimmedFirstName} ${trimmedLastName}`,
        {
          phone: trimmedPhone,
          location: trimmedCity,
          bloodType: selectedBloodType ?? '',
        },
      );
      await updateUser({
        name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
        location: trimmedCity,
        medicalNotes: '',
        bloodType: selectedBloodType ?? '',
      });
      setSuccessModalVisible(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurred.';
      Alert.alert('Unable to create account', message);
    } finally {
      setCreatingAccount(false);
    }
  };
  const openBloodTypeDropdown = useCallback(() => {
    bloodTypeAnim.stopAnimation();
    setBloodTypeOpen(true);
    Animated.timing(bloodTypeAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [bloodTypeAnim]);

  const closeBloodTypeDropdown = useCallback(() => {
    bloodTypeAnim.stopAnimation();
    Animated.timing(bloodTypeAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setBloodTypeOpen(false);
    });
  }, [bloodTypeAnim]);

  const handleBloodTypeToggle = useCallback(() => {
    if (bloodTypeOpen) {
      closeBloodTypeDropdown();
    } else {
      openBloodTypeDropdown();
    }
  }, [bloodTypeOpen, closeBloodTypeDropdown, openBloodTypeDropdown]);

  const renderFooterPrompt = () => (
    <View style={styles.footerPrompt}>
      <Text style={styles.promptText}>Already have an account?</Text>
      <TouchableOpacity onPress={() => router.push('/sign-in')} activeOpacity={0.7}>
        <Text style={styles.linkText}> Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNextButton = (
    options?: {
      wrapperStyle?: StyleProp<ViewStyle>;
    }
  ) => (
    <Animated.View style={[styles.buttonWrapper, options?.wrapperStyle]}>
      <Animated.View style={{ transform: [{ translateX: nextButtonShake }] }}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => {
            closeBloodTypeDropdown();
            handleNextStep();
          }}
        >
          <Text style={styles.primaryText}>Next</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>First Name</Text>
              <View style={[styles.inputRow, errors.firstName ? styles.inputRowError : null]}>
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your first name"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={(value) => {
                    const formatted = formatProperName(value);
                    setFirstName(formatted);
                    if (errors.firstName) {
                      clearFieldError('firstName');
                    }
                  }}
                  onFocus={closeBloodTypeDropdown}
                />
              </View>
              {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

              {renderNextButton()}
            </View>

            {renderFooterPrompt()}
          </>
        );
      case 1:
        return (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>Last Name</Text>
              <View style={[styles.inputRow, errors.lastName ? styles.inputRowError : null]}>
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your last name"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={(value) => {
                    const formatted = formatProperName(value);
                    setLastName(formatted);
                    if (errors.lastName) {
                      clearFieldError('lastName');
                    }
                  }}
                  onFocus={closeBloodTypeDropdown}
                />
              </View>
              {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

              {renderNextButton()}
            </View>

            {renderFooterPrompt()}
          </>
        );
      case 2:
        return (
          <>
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
                  onFocus={closeBloodTypeDropdown}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

              {renderNextButton()}
            </View>

            {renderFooterPrompt()}
          </>
        );
      case 3:
        return (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>Living City</Text>
              <View style={[styles.inputRow, errors.city ? styles.inputRowError : null]}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your living city"
                  placeholderTextColor="#9CA3AF"
                  value={city}
                  onChangeText={(value) => {
                    const sanitized = sanitizeCity(value);
                    setCity(sanitized);
                    if (errors.city) {
                      clearFieldError('city');
                    }
                  }}
                  onFocus={closeBloodTypeDropdown}
                />
              </View>
              {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

              {renderNextButton()}
            </View>

            {renderFooterPrompt()}
          </>
        );
      case 4:
        return (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputRow, errors.phone ? styles.inputRowError : null]}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(value) => {
                    const digits = sanitizePhone(value).slice(0, 10);
                    const formatted = formatPhoneNumber(digits);
                    setPhone(formatted);
                    if (errors.phone) {
                      clearFieldError('phone');
                    }
                  }}
                  onFocus={closeBloodTypeDropdown}
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

              {renderNextButton()}
            </View>

            {renderFooterPrompt()}
          </>
        );
      case 5: {
        const nextButtonWrapperStyle: StyleProp<ViewStyle> = errors.bloodType
          ? styles.buttonWrapperBloodTypeOpen
          : [
              styles.buttonWrapperBloodType,
              {
                marginTop: bloodTypeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 16],
                  extrapolate: 'clamp',
                }),
              },
            ];

        return (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>Blood Type</Text>
              <TouchableOpacity
                style={[
                  styles.inputRow,
                  bloodTypeOpen && styles.inputRowActive,
                  errors.bloodType ? styles.inputRowError : null,
                ]}
                activeOpacity={0.7}
                onPress={handleBloodTypeToggle}
              >
                <Ionicons name="water-outline" size={20} color="#6B7280" />
                <Text
                  style={[
                    styles.placeholderText,
                    selectedBloodType && styles.inputValue,
                  ]}
                >
                  {selectedBloodType ?? 'Select your blood type'}
                </Text>
                <Ionicons
                  name={bloodTypeOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
              <Animated.View
                pointerEvents={bloodTypeOpen ? 'auto' : 'none'}
                style={[
                  styles.dropdownWrapper,
                  {
                    opacity: bloodTypeAnim,
                    transform: [
                      {
                        scaleY: bloodTypeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                    maxHeight: bloodTypeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 380],
                    }),
                    marginTop: bloodTypeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                    marginBottom: bloodTypeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0],
                    }),
                  },
                ]}
              >
                <View style={styles.dropdown}>
                  {bloodTypes.map((type) => {
                    const isSelected = selectedBloodType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedBloodType(type);
                          if (errors.bloodType) {
                            clearFieldError('bloodType');
                          }
                          closeBloodTypeDropdown();
                        }}
                      >
                        <Ionicons
                          name="water"
                          size={18}
                          color={isSelected ? '#DC2626' : '#6B7280'}
                          style={styles.dropdownIcon}
                        />
                        <Text
                          style={[styles.dropdownText, isSelected && styles.dropdownTextActive]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
              {errors.bloodType ? (
                <Animated.Text
                  style={[
                    styles.errorText,
                    styles.bloodTypeError,
                    {
                      marginTop: bloodTypeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-18, -8],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  {errors.bloodType}
                </Animated.Text>
              ) : null}

              {renderNextButton({
                wrapperStyle: nextButtonWrapperStyle,
              })}
            </View>

            {renderFooterPrompt()}
          </>
        );
      }
      case 6:
        return (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>Birthday</Text>
              <View style={[styles.inputRow, errors.birthday ? styles.inputRowError : null]}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numbers-and-punctuation"
                  value={birthday}
                  maxLength={10}
                  onChangeText={(value) => {
                    const digitsOnly = sanitizeBirthday(value).slice(0, 8);
                    let formatted = digitsOnly;
                    if (digitsOnly.length > 2) {
                      formatted = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`;
                    }
                    if (digitsOnly.length > 4) {
                      formatted = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(4)}`;
                    }
                    setBirthday(formatted);
                    if (errors.birthday) {
                      clearFieldError('birthday');
                    }
                  }}
                  onFocus={closeBloodTypeDropdown}
                />
              </View>
              {errors.birthday ? <Text style={styles.errorText}>{errors.birthday}</Text> : null}

              {renderNextButton()}
            </View>

            {renderFooterPrompt()}
          </>
        );
      case 7:
      default:
        return (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>Password</Text>
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
                  onFocus={closeBloodTypeDropdown}
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

              <Animated.View
                style={[styles.buttonWrapper, { transform: [{ translateX: createAccountShake }] }]}
              >
                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.9}
                  onPress={handleCreateAccount}
                  disabled={creatingAccount}
                >
                  {creatingAccount ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {renderFooterPrompt()}
          </>
        );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCopy}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the E-Donor community today</Text>
      </View>

      <View style={styles.stepsWrapper}>
        <Animated.View
          style={[
            styles.stepsContainer,
            {
              width: SCREEN_WIDTH * STEP_COUNT,
              transform: [{ translateX: stepsTranslate }],
            },
          ]}
          {...stepPanResponder.panHandlers}
        >
          {Array.from({ length: STEP_COUNT }).map((_, index) => (
            <View key={`sign-up-step-${index}`} style={[styles.step, { width: SCREEN_WIDTH }]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: 32 + insets.bottom },
                ]}
              >
                {renderStepContent(index)}
              </ScrollView>
            </View>
          ))}
        </Animated.View>
      </View>

      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Account Created</Text>
            <Text style={styles.modalMessage}>Sign up was successful. You can log in now.</Text>
            <TouchableOpacity
              style={[styles.primaryButton, styles.modalPrimary]}
              activeOpacity={0.9}
              onPress={() => {
                setSuccessModalVisible(false);
                router.replace('/sign-in');
              }}
            >
              <Text style={styles.primaryText}>Go to Sign In</Text>
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
    backgroundColor: 'white',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 18,
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
    paddingHorizontal: 24,
    paddingLeft: 40,
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
  stepsWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  stepsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  step: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalPrimary: {
    width: '100%',
    borderRadius: 14,
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
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  inputRow: {
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
  inputRowActive: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  placeholderText: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
  },
  inputValue: {
    color: '#111827',
  },
  errorText: {
    marginTop: -6,
    marginLeft: 14,
    marginBottom: -8,
    fontSize: 12,
    color: '#DC2626',
  },
  bloodTypeError: {
    marginTop: -18,
    marginBottom: -8,
  },
  buttonWrapper: {
    marginTop: 16,
  },
  buttonWrapperBloodType: {
    marginTop: 4,
  },
  buttonWrapperBloodTypeOpen: {
    marginTop: 16,
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
  dropdown: {
    marginTop: 8,
    marginHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dropdownWrapper: {
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 14,
    borderColor: 'transparent',
  },
  dropdownItemActive: {
    backgroundColor: '#DC262624',
    marginHorizontal: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 8,
  },
  dropdownIcon: {
    width: 20,
  },
  dropdownText: {
    fontSize: 15,
    color: '#111827',
  },
  dropdownTextActive: {
    fontWeight: '600',
    color: '#DC2626',
  },
});
