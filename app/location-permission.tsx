import { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Radius } from '@/constants/theme';
import { requestAndSaveLocation, markLocationPromptShown } from '@/hooks/use-location';
import { auth } from '@/config/firebase';

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const pingAnim = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, { toValue: 2.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pingAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const navigateNext = () => {
    const user = auth.currentUser;
    router.replace(user ? '/(tabs)' : '/auth');
  };

  const handleAllow = async () => {
    setLoading(true);
    await requestAndSaveLocation(); // requests OS permission + saves coords
    setLoading(false);
    navigateNext();
  };

  const handleManual = async () => {
    await markLocationPromptShown(); // skip today's prompt
    navigateNext();
  };

  return (
    <View style={styles.container}>
      <View style={styles.glowTR} />
      <View style={styles.glowBL} />

      <View style={[styles.content, { paddingTop: insets.top + 12, gap: height < 720 ? 18 : 28 }]}>
        <View style={[styles.bentoGrid, { height: height < 720 ? 150 : 220 }]}>
          <View style={styles.bentoMain}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' }}
              style={styles.bentoMainImg}
            />
            <View style={styles.bentoMainOverlay} />
          </View>
          <View style={styles.bentoSide}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80' }}
              style={styles.bentoSideImg}
            />
            <View style={styles.locationIconCard}>
              <Text style={styles.locationIcon}>📍</Text>
            </View>
          </View>
        </View>

        <Text style={styles.headline}>
          Discover the{' '}
          <Text style={styles.headlineAccent}>Best Flavors</Text>
          {'\n'}Near You
        </Text>
        <Text style={styles.body}>
          Enable location to find food near you and experience curated local cuisines delivered with precision.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAllow} activeOpacity={0.85} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.onTertiaryContainer} />
              : <Text style={styles.primaryBtnText}>Allow Location Access</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={handleManual} activeOpacity={0.7}>
            <Text style={styles.ghostBtnText}>ENTER ADDRESS MANUALLY</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pulsarPill}>
          <View style={styles.pulsarWrap}>
            <Animated.View style={[styles.pulsarRing, { transform: [{ scale: pingAnim }] }]} />
            <View style={styles.pulsarDot} />
          </View>
          <Text style={styles.pulsarText}>LIVE CURATION ACTIVE IN LAGOS & ABUJA</Text>
        </View>
      </View>

      <Text style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 8, 32) }]}>PRIVACY FIRST ARCHITECTURE © 2024</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  glowTR: { position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: Colors.primaryContainer, opacity: 0.12 },
  glowBL: { position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.tertiaryContainer, opacity: 0.06 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 28 },
  bentoGrid: { flexDirection: 'row', gap: 12, width: '100%', height: 220 },
  bentoMain: { flex: 2, borderRadius: Radius.xl, overflow: 'hidden' },
  bentoMainImg: { width: '100%', height: '100%' },
  bentoMainOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19,19,19,0.3)' },
  bentoSide: { flex: 1, gap: 12 },
  bentoSideImg: { flex: 1, borderRadius: Radius.xl },
  locationIconCard: { flex: 1, backgroundColor: 'rgba(0,128,128,0.2)', borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  locationIcon: { fontSize: 36 },
  headline: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: Colors.onSurface, letterSpacing: -1, lineHeight: 42, textAlign: 'center' },
  headlineAccent: { color: Colors.primary, fontStyle: 'italic' },
  body: { fontFamily: Typography.body, fontSize: 16, color: Colors.onSurfaceVariant, lineHeight: 26, textAlign: 'center', maxWidth: 320 },
  actions: { width: '100%', gap: 12 },
  primaryBtn: { backgroundColor: Colors.tertiaryContainer, borderRadius: Radius.xl, paddingVertical: 18, alignItems: 'center' },
  primaryBtnText: { fontFamily: Typography.headline, fontSize: 16, color: Colors.onTertiaryContainer },
  ghostBtn: { paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { fontFamily: Typography.label, fontSize: 11, color: Colors.onSurfaceVariant, letterSpacing: 2 },
  pulsarPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(62,73,73,0.15)' },
  pulsarWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  pulsarRing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, opacity: 0.4 },
  pulsarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  pulsarText: { fontFamily: Typography.label, fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 2 },
  footer: { textAlign: 'center', fontFamily: Typography.label, fontSize: 9, color: Colors.outline, letterSpacing: 3, opacity: 0.5 },
});
