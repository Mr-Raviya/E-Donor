import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Slide = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBackground: string;
  title: string;
  subtitle: string;
  buttonLabel?: string;
};

const slides: Slide[] = [
  {
    iconName: 'heart-outline',
    iconColor: '#DC2626',
    iconBackground: '#FEE2E2',
    title: 'Be a Hero',
    subtitle:
      'Your blood donation can save up to 3 lives. Join thousands of donors making a difference every day.',
  },
  {
    iconName: 'people-outline',
    iconColor: '#2563EB',
    iconBackground: '#EFF6FF',
    title: 'Find Help Fast',
    subtitle:
      'Connect with verified donors in your area. Get matched with compatible blood types instantly.',
  },
  {
    iconName: 'business-outline',
    iconColor: '#16A34A',
    iconBackground: '#DCFCE7',
    title: 'For Hospitals',
    subtitle:
      'Manage blood requests efficiently. Access a network of willing donors and maintain inventory levels.',
    buttonLabel: 'Get Started',
  },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const slideTranslate = useRef(new Animated.Value(0)).current;
  const slideOpacity = useRef(new Animated.Value(1)).current;

  const currentSlide = useMemo(() => slides[currentStep], [currentStep]);
  const buttonLabel = currentSlide.buttonLabel ?? 'Continue';

  const goToRoleSelection = () => {
    router.push('/sign-in');
  };

  const animateStepChange = useCallback(
    (targetStep: number) => {
      if (targetStep === currentStep || targetStep < 0 || targetStep >= slides.length) {
        return;
      }

      const direction = targetStep > currentStep ? -1 : 1;
      const outTo = direction * 40;

      slideTranslate.stopAnimation();
      slideOpacity.stopAnimation();

      Animated.parallel([
        Animated.timing(slideTranslate, {
          toValue: outTo,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(targetStep);
        slideTranslate.setValue(-outTo);
        slideOpacity.setValue(0);

        Animated.parallel([
          Animated.timing(slideTranslate, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(slideOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [currentStep, slideOpacity, slideTranslate]
  );

  const handleSkip = () => {
    goToRoleSelection();
  };

  const handleContinue = () => {
    if (currentStep < slides.length - 1) {
      animateStepChange(currentStep + 1);
    } else {
      goToRoleSelection();
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      router.back();
    } else {
      animateStepChange(currentStep - 1);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 12,
        onPanResponderRelease: (_event, gestureState) => {
          const { dx, vx } = gestureState;
          if ((dx < -60 || vx < -0.4) && currentStep < slides.length - 1) {
            animateStepChange(currentStep + 1);
            return;
          }
          if ((dx > 60 || vx > 0.4) && currentStep > 0) {
            animateStepChange(currentStep - 1);
          }
        },
      }),
    [animateStepChange, currentStep]
  );

  const animatedSlideStyle = useMemo(
    () => ({
      transform: [{ translateX: slideTranslate }],
      opacity: slideOpacity,
    }),
    [slideOpacity, slideTranslate]
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityLabel="Go back"
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>

        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSkip}
          accessibilityLabel="Skip onboarding"
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ctaWrapper}>
        <Animated.View style={[styles.contentWrapper, animatedSlideStyle]}>
          <View style={styles.heroSection}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: currentSlide.iconBackground },
              ]}
            >
              <Ionicons name={currentSlide.iconName} size={50} color={currentSlide.iconColor} />
            </View>
            <Text style={styles.heroTitle}>{currentSlide.title}</Text>
            <Text style={styles.heroSubtitle}>{currentSlide.subtitle}</Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          onPress={handleContinue}
          style={styles.ctaButton}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{buttonLabel}</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  ctaWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 6,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  skipText: {
    marginTop: -2,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  ctaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
