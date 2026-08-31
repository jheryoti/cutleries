import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius } from '@/constants/theme';
import { shouldShowLocationPrompt, getCachedLocation, requestAndSaveLocation } from '@/hooks/use-location';
import { auth } from '@/config/firebase';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(async () => {
      const showPrompt = await shouldShowLocationPrompt();
      if (showPrompt) {
        // First entry of the day — show location permission screen
        router.replace('/location-permission');
      } else {
        // Already prompted today — silently refresh location in background
        requestAndSaveLocation();
        const user = auth.currentUser;
        router.replace(user ? '/(tabs)' : '/auth');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80' }}
        style={styles.bgImage}
        blurRadius={2}
      />
      <LinearGradient
        colors={['rgba(19,19,19,0.2)', 'rgba(19,19,19,0.85)', Colors.surface]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.radialGlow} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoCluster}>
          <Text style={styles.brandName}>CUTLERIES</Text>
          <Text style={styles.tagline}>CUTLERIES</Text>
        </View>

        <View style={styles.pulsarContainer}>
          <Animated.View style={[styles.pulsarRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.pulsarDot} />
        </View>
        <Text style={styles.loadingText}>PREPARING YOUR MENU</Text>
      </Animated.View>

      <View style={[styles.footer, { bottom: Math.max(insets.bottom + 24, 48) }]}>
        <View>
          <Text style={styles.footerCity}>Lagos, NG</Text>
          <Text style={styles.footerLabel}>PREMIUM DELIVERY</Text>
        </View>
        <View style={styles.iconCard}>
          <Text style={styles.iconEmoji}>🍽️</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  radialGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.primaryContainer,
    opacity: 0.12,
    top: '30%',
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 48,
    paddingHorizontal: 24,
  },
  logoCluster: {
    alignItems: 'center',
    gap: 12,
  },
  brandName: {
    fontFamily: Typography.headline,
    fontSize: 56,
    color: Colors.primary,
    letterSpacing: -2,
    fontStyle: 'italic',
  },
  tagline: {
    fontFamily: Typography.label,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 6,
  },
  pulsarContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  pulsarRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    opacity: 0.3,
  },
  pulsarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    elevation: 8,
    boxShadow: '0px 0px 8px rgba(118,214,213,0.8)',
  },
  loadingText: {
    fontFamily: Typography.label,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 4,
    opacity: 0.6,
    marginTop: -32,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerCity: {
    fontFamily: Typography.headlineBold,
    fontSize: 20,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  footerLabel: {
    fontFamily: Typography.label,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 4,
    marginTop: 2,
  },
  iconCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(62,73,73,0.15)',
  },
  iconEmoji: {
    fontSize: 22,
  },
});
