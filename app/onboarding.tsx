import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, Image, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Instant Food\nDiscovery',
    subtitle: "Curated flavors from Lagos' top kitchens delivered to your doorstep with editorial precision.",
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    image2: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    badge: "Chef's Choice",
    badgeLabel: 'Local Classics',
    cta: 'Next',
    ctaStyle: 'primary',
  },
  {
    id: '2',
    title: 'Lightning Fast\nDelivery',
    subtitle: 'Our logistics network ensures your meal arrives at the peak of its temperature and taste.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    floatLabel: 'On My Way',
    floatSub: 'Arriving in 12 mins',
    cta: 'Next',
    ctaStyle: 'primary',
  },
  {
    id: '3',
    title: 'Secure Wallet\nPayments',
    subtitle: 'Top up your digital wallet for instant, one-tap payments and exclusive member rewards.',
    cta: 'Get Started',
    ctaStyle: 'tertiary',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace('/location-permission');
    }
  };

  const handleSkip = () => router.replace('/location-permission');

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
    <View style={styles.slide}>
      {index < 2 && (
        <TouchableOpacity style={[styles.skipBtn, { top: insets.top + 12 }]} onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      )}

      <View style={styles.visual}>
        <View style={styles.glow} />
        {index === 0 && (
          <View style={styles.bentoGrid}>
            <View style={styles.bentoLeft}>
              <Image source={{ uri: item.image }} style={styles.bentoImgFull} />
            </View>
            <View style={styles.bentoRight}>
              <Image source={{ uri: item.image2 }} style={styles.bentoImgHalf} />
              <View style={styles.bentoCard}>
                <Text style={styles.bentoCardLabel}>CHEF&apos;S CHOICE</Text>
                <Text style={styles.bentoCardTitle}>Local Classics</Text>
              </View>
            </View>
          </View>
        )}
        {index === 1 && (
          <View style={styles.deliveryCard}>
            <Image source={{ uri: item.image }} style={styles.deliveryImg} />
            <View style={styles.floatCard}>
              <View style={styles.floatIcon}>
                <Text style={{ fontSize: 20 }}>⚡</Text>
              </View>
              <View>
                <Text style={styles.floatLabel}>ON MY WAY</Text>
                <Text style={styles.floatSub}>Arriving in 12 mins</Text>
              </View>
            </View>
          </View>
        )}
        {index === 2 && (
          <View style={styles.cardStack}>
            <View style={[styles.creditCardBack]} />
            <View style={styles.creditCard}>
              <View style={styles.chip} />
              <Text style={styles.cardNumber}>**** **** **** 8824</Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardMeta}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>CHEF CURATOR</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardMeta}>EXPIRES</Text>
                  <Text style={styles.cardValue}>12/28</Text>
                </View>
              </View>
              <View style={styles.cardGlow} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <TouchableOpacity
          style={[styles.cta, item.ctaStyle === 'tertiary' ? styles.ctaTertiary : styles.ctaPrimary]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, item.ctaStyle === 'tertiary' ? styles.ctaTextTertiary : styles.ctaTextPrimary]}>
            {item.cta}
          </Text>
          <Text style={[styles.ctaArrow, item.ctaStyle === 'tertiary' ? { color: Colors.onTertiaryContainer } : { color: Colors.onPrimaryContainer }]}>
            →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  slide: { width, height, backgroundColor: Colors.surface },
  skipBtn: { position: 'absolute', right: 24, zIndex: 20, paddingVertical: 8, paddingHorizontal: 16 },
  skipText: { fontFamily: Typography.label, fontSize: 12, color: Colors.onSurfaceVariant, letterSpacing: 3 },
  visual: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: Colors.primary, opacity: 0.07 },
  bentoGrid: { flexDirection: 'row', gap: 12, width: '100%', height: 360 },
  bentoLeft: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  bentoImgFull: { width: '100%', height: '100%' },
  bentoRight: { flex: 1, gap: 12 },
  bentoImgHalf: { flex: 1, borderRadius: Radius.xl },
  bentoCard: { flex: 1, backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radius.xl, padding: 16, justifyContent: 'center' },
  bentoCardLabel: { fontFamily: Typography.label, fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 4 },
  bentoCardTitle: { fontFamily: Typography.headlineBold, fontSize: 13, color: Colors.onSurface },
  deliveryCard: { width: '100%', aspectRatio: 1, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  deliveryImg: { width: '100%', height: '100%' },
  floatCard: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: 'rgba(19,19,19,0.85)', borderRadius: Radius.xxl, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  floatIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(118,214,213,0.2)', alignItems: 'center', justifyContent: 'center' },
  floatLabel: { fontFamily: Typography.label, fontSize: 10, color: Colors.primary, letterSpacing: 2 },
  floatSub: { fontFamily: Typography.headlineBold, fontSize: 13, color: Colors.onSurface, marginTop: 2 },
  cardStack: { width: '100%', maxWidth: 340, alignSelf: 'center', height: 220 },
  creditCardBack: { position: 'absolute', top: -40, left: -12, right: 0, height: 200, backgroundColor: 'rgba(0,128,128,0.25)', borderRadius: 24, transform: [{ rotate: '-8deg' }] },
  creditCard: { width: '100%', height: 200, backgroundColor: '#1e1e1e', borderRadius: 28, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', justifyContent: 'space-between' },
  chip: { width: 44, height: 34, backgroundColor: 'rgba(255,181,160,0.2)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,181,160,0.3)' },
  cardNumber: { fontFamily: 'monospace', fontSize: 16, color: Colors.onSurface, letterSpacing: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { fontFamily: Typography.label, fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 3, marginBottom: 2 },
  cardValue: { fontFamily: Typography.headlineBold, fontSize: 12, color: Colors.onSurface },
  cardGlow: { position: 'absolute', bottom: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primary, opacity: 0.15 },
  bottomSheet: { backgroundColor: Colors.surfaceContainerLow, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 32, paddingTop: 40, paddingBottom: 48, gap: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 28, backgroundColor: Colors.primary },
  dotInactive: { width: 8, backgroundColor: Colors.outlineVariant },
  title: { fontFamily: Typography.headline, fontSize: 36, color: Colors.onSurface, letterSpacing: -1, lineHeight: 44 },
  subtitle: { fontFamily: Typography.body, fontSize: 16, color: Colors.onSurfaceVariant, lineHeight: 26 },
  cta: { borderRadius: Radius.xl, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaPrimary: { backgroundColor: Colors.primaryContainer },
  ctaTertiary: { backgroundColor: Colors.tertiaryContainer },
  ctaText: { fontFamily: Typography.headline, fontSize: 16 },
  ctaTextPrimary: { color: Colors.onPrimaryContainer },
  ctaTextTertiary: { color: Colors.onTertiaryContainer },
  ctaArrow: { fontSize: 18 },
});
