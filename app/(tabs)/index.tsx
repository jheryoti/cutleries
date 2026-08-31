import { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { api } from '@/services/api';
import HomeHeader from '@/components/HomeHeader';
import Skeleton from '@/components/Skeleton';
import { useApp } from '@/context/AppContext';

// ── Skeleton screens ────────────────────────────────────────────────────────
function PromoSkeleton() {
  return (
    <View style={[skeletonStyles.promoBanner, { overflow: 'hidden' }]}>
      <View style={{ gap: 10, flex: 1 }}>
        <Skeleton width={80} height={10} borderRadius={4} />
        <Skeleton width={160} height={22} borderRadius={6} />
        <Skeleton width={120} height={22} borderRadius={6} />
        <Skeleton width={100} height={36} borderRadius={12} />
      </View>
      <Skeleton width={72} height={72} borderRadius={16} />
    </View>
  );
}

function CategorySkeleton() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
      {[100, 90, 110, 95, 105].map((w, i) => (
        <Skeleton key={i} width={w} height={40} borderRadius={14} />
      ))}
    </ScrollView>
  );
}

function VendorCardSkeleton() {
  return (
    <View style={skeletonStyles.vendorCard}>
      <Skeleton width="100%" height={200} borderRadius={0} />
      <View style={{ padding: 16, gap: 10 }}>
        <Skeleton width="60%" height={16} borderRadius={6} />
        <Skeleton width="40%" height={12} borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton width={70} height={11} borderRadius={4} />
          <Skeleton width={50} height={11} borderRadius={4} />
          <Skeleton width={80} height={11} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { cartCount, unreadCount } = useApp();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [promoLoading, setPromoLoading] = useState(true);

  useEffect(() => {
    // Simulate promo loading separately for skeleton demo
    const promoTimer = setTimeout(() => setPromoLoading(false), 1200);
    Promise.all([api.getCategories(), api.getVendors()])
      .then(([cats, vends]) => {
        setCategories(cats);
        setVendors(vends);
      })
      .catch(() => {
        setCategories([]);
        setVendors([]);
      })
      .finally(() => setLoading(false));
    return () => clearTimeout(promoTimer);
  }, []);

  const headerBg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(19,19,19,0)', 'rgba(19,19,19,0.98)'],
    extrapolate: 'clamp',
  });

  const filteredVendors = activeCategory
    ? vendors.filter((v) =>
        v.categoryId === activeCategory ||
        v.cuisine?.toLowerCase().includes(activeCategory.toLowerCase())
      )
    : vendors;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      <HomeHeader headerBg={headerBg} paddingTop={insets.top + 14} />

      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 80 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroGreeting}>{greeting} 👋</Text>
          <Text style={styles.heroTitle}>What are you{'\n'}craving today?</Text>
        </View>

        {/* Search */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search dishes, restaurants...</Text>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>Filter</Text>
          </View>
        </TouchableOpacity>

        {/* Promo — skeleton or real */}
        {promoLoading ? (
          <View style={{ paddingHorizontal: 20 }}>
            <PromoSkeleton />
          </View>
        ) : (
          <View style={styles.promoBanner}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTag}>LIMITED OFFER</Text>
              <Text style={styles.promoTitle}>Free delivery{'\n'}on first order</Text>
              <TouchableOpacity style={styles.promoBtn} activeOpacity={0.85}>
                <Text style={styles.promoBtnText}>Order Now</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.promoEmoji}>🍜</Text>
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity><Text style={styles.viewAll}>See all</Text></TouchableOpacity>
          </View>
          {loading ? (
            <CategorySkeleton />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                  <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Vendors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
              {!loading && (
                <Text style={styles.sectionSub}>{filteredVendors.length} places near you</Text>
              )}
            </View>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>⇅ Sort</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <>
              <VendorCardSkeleton />
              <VendorCardSkeleton />
              <VendorCardSkeleton />
            </>
          ) : (
            filteredVendors.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                style={styles.vendorCard}
                onPress={() => router.push(`/vendor/${vendor.id}`)}
                activeOpacity={0.92}
              >
                <View style={styles.vendorImageWrap}>
                  <Image source={{ uri: vendor.imageURL }} style={styles.vendorImage} />
                  <View style={styles.vendorImageOverlay} />
                  {vendor.badge && (
                    <View style={styles.vendorBadge}>
                      <Text style={styles.vendorBadgeText}>{vendor.badge}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.heartBtn}>
                    <Text style={styles.heartIcon}>♡</Text>
                  </TouchableOpacity>
                  <View style={styles.ratingPill}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text style={styles.ratingText}>{vendor.rating}</Text>
                  </View>
                </View>
                <View style={styles.vendorInfo}>
                  <View style={styles.vendorInfoTop}>
                    <Text style={styles.vendorName}>{vendor.name}</Text>
                    {vendor.isOpen === false && (
                      <View style={styles.closedBadge}>
                        <Text style={styles.closedText}>Closed</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.vendorCuisine}>{vendor.cuisine}</Text>
                  <View style={styles.vendorMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>🕐</Text>
                      <Text style={styles.metaText}>{vendor.deliveryTimeMin}–{vendor.deliveryTimeMax} min</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>📍</Text>
                      <Text style={styles.metaText}>{vendor.distanceKm} km</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>🛵</Text>
                      <Text style={styles.metaText}>
                        {vendor.deliveryFee === 0 ? 'Free delivery' : `₦${vendor.deliveryFee}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </Animated.ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/cart')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Skeleton styles ─────────────────────────────────────────────────────────
const skeletonStyles = StyleSheet.create({
  promoBanner: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24, padding: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  vendorCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
});

// ── Main styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingBottom: 120, gap: 28 },

  heroSection: { paddingHorizontal: 20, gap: 6 },
  heroGreeting: { fontFamily: Typography.body, fontSize: 14, color: Colors.onSurfaceVariant },
  heroTitle: { fontFamily: Typography.headline, fontSize: 30, color: Colors.onSurface, letterSpacing: -0.8, lineHeight: 36 },

  searchBar: {
    marginHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { flex: 1, fontFamily: Typography.body, fontSize: 14, color: Colors.onSurfaceVariant },
  filterPill: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  filterPillText: { fontFamily: Typography.label, fontSize: 11, color: Colors.onPrimary },

  promoBanner: {
    marginHorizontal: 20,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 24, padding: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden',
  },
  promoContent: { gap: 10, flex: 1 },
  promoTag: { fontFamily: Typography.label, fontSize: 10, color: `${Colors.onPrimaryContainer}99`, letterSpacing: 2 },
  promoTitle: { fontFamily: Typography.headline, fontSize: 22, color: Colors.onPrimaryContainer, letterSpacing: -0.5, lineHeight: 28 },
  promoBtn: { backgroundColor: Colors.onPrimaryContainer, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start' },
  promoBtnText: { fontFamily: Typography.headlineBold, fontSize: 13, color: Colors.primaryContainer },
  promoEmoji: { fontSize: 64, marginRight: -8 },

  section: { gap: 16, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { fontFamily: Typography.headlineBold, fontSize: 20, color: Colors.onSurface, letterSpacing: -0.3 },
  sectionSub: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  viewAll: { fontFamily: Typography.bodySemiBold, fontSize: 13, color: Colors.primary },
  sortBtn: { backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 },
  sortBtnText: { fontFamily: Typography.label, fontSize: 12, color: Colors.onSurface },

  categoriesRow: { gap: 10, paddingRight: 4 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'transparent',
  },
  categoryChipActive: { backgroundColor: `${Colors.primary}18`, borderColor: `${Colors.primary}40` },
  categoryEmoji: { fontSize: 18 },
  categoryLabel: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
  categoryLabelActive: { color: Colors.primary },

  vendorCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  vendorImageWrap: { height: 200, position: 'relative' },
  vendorImage: { width: '100%', height: '100%' },
  vendorImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  vendorBadge: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  vendorBadgeText: { fontFamily: Typography.label, fontSize: 10, color: Colors.onPrimary, letterSpacing: 0.5 },
  heartBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartIcon: { fontSize: 16, color: '#fff' },
  ratingPill: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  ratingStar: { fontSize: 11, color: '#FFD700' },
  ratingText: { fontFamily: Typography.headlineBold, fontSize: 12, color: '#fff' },
  vendorInfo: { padding: 16, gap: 8 },
  vendorInfoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vendorName: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.onSurface, letterSpacing: -0.3 },
  closedBadge: { backgroundColor: `${Colors.error}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  closedText: { fontFamily: Typography.label, fontSize: 10, color: Colors.error },
  vendorCuisine: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 12 },
  metaText: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.outline },

  fab: {
    position: 'absolute', right: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.tertiaryContainer,
    alignItems: 'center', justifyContent: 'center',
    elevation: 10,
  },
  fabIcon: { fontSize: 22 },
  fabBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  fabBadgeText: { fontFamily: Typography.headlineBold, fontSize: 10, color: '#fff' },
});
