import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const features = [
  'Connect with nearby donors',
  'Request blood urgently',
  'Save lives in your community',
];

export default function WelcomeScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(12)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(26)).current;

  // Kick off entry and ongoing sway animations for the hero area
  useEffect(() => {
    const logoEntry = Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    });

    logoRotate.setValue(0);
    const logoSway = Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 3200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );

    const titleAnimation = Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const cardAnimation = Animated.sequence([
      Animated.delay(380),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslate, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    ]);

    logoEntry.start(() => logoSway.start());
    titleAnimation.start();
    cardAnimation.start();

    return () => {
      logoEntry.stop();
      logoSway.stop();
      titleAnimation.stop();
      cardAnimation.stop();
    };
  }, [logoScale, logoRotate, titleOpacity, titleTranslate, cardOpacity, cardTranslate]);

  return (
    <LinearGradient
      colors={['#FDE2E4', '#FFF1F2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoStack,
              {
                transform: [
                  { scale: logoScale },
                  {
                    rotate: logoRotate.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['-6deg', '6deg', '-6deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.primaryLogo}>
              <Ionicons name="water" size={50} color="white" />
            </View>
            <View style={styles.heartBadge}>
              <Ionicons name="heart" size={20} color="#DC2626" />
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.title,
              { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
            ]}
          >
            E-Donor
          </Animated.Text>
          <Text style={styles.subtitle}>
            Connecting hearts, saving lives through digital blood donation
          </Text>

          <Animated.View
            style={[
              styles.featureCard,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] },
            ]}
          >
            {features.map((feature) => (
              <View key={feature} style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </Animated.View>

          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.9}
            onPress={() => router.push('/onboarding')}
            accessibilityLabel="Start onboarding"
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },
  logoStack: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  primaryLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  heartBadge: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  featureCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    gap: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#DC2626',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.2,
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
