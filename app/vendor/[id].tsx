import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { api } from '@/services/api';
import { useApp } from '@/context/AppContext';

export default function VendorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart, cartItems, cartTotal, cartCount, updateQty } = useApp();
  const [vendor, setVendor] = useState<any>(null);
  const [menu, setMenu] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({ inputRange: [220, 300], outputRange: [0, 1], extrapolate: 'clamp' });
  const heroScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.1, 1], extrapolate: 'clamp' });

  useEffect(() => {
    Promise.all([api.getVendor(id), api.getVendorMenu(id)])
      .then(([v, m]) => {
        setVendor(v);
        setMenu(m);
        setActiveCategory(Object.keys(m)[0] || '');
      })
      .catch(() => {
        setVendor(null);
        setMenu({});
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = (item: any) => {
    addToCart({ id: item.id, name: item.name, price: item.price, qty: 1, imageURL: item.imageURL, vendorId: id, vendorName: vendor?.name || '' });
  };

  const getQty = (itemId: string) => cartItems.find((i) => i.id === itemId)?.qty ?? 0;
  const toggleFav = (itemId: string) => setFavorites((prev) => { const s = new Set(prev); s.has(itemId) ? s.delete(itemId) : s.add(itemId); return s; });

  const vendorCartTotal = cartItems.filter((i) => i.vendorId === id).reduce((s, i) => s + i.price * i.qty, 0);
  const vendorCartCount = cartItems.filter((i) => i.vendorId === id).reduce((s, i) => s + i.qty, 0);
  const categories = Object.keys(menu);
  const items = menu[activeCategory] || [];

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackBtn}>
          <Text style={styles.stickyBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stickyTitle} numberOfLines={1}>{vendor?.name}</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (vendorCartCount > 0 ? 100 : 24) }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <Animated.Image source={{ uri: vendor?.imageURL }} style={[styles.heroImage, { transform: [{ scale: heroScale }] }]} />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={[styles.heroBackBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
            <Text style={styles.heroBackIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.heroFavBtn, { top: insets.top + 12 }]}>
            <Text style={styles.heroFavIcon}>♡</Text>
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{vendor?.name}</Text>
            <Text style={styles.heroCuisine}>{vendor?.cuisine}</Text>
            <View style={styles.heroBadges}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeStar}>★</Text>
                <Text style={styles.heroBadgeText}>{vendor?.rating}</Text>
                <Text style={styles.heroBadgeSub}>({vendor?.reviewCount}+)</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeIcon}>🕐</Text>
                <Text style={styles.heroBadgeText}>{vendor?.deliveryTimeMin}–{vendor?.deliveryTimeMax} min</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeIcon}>🛵</Text>
                <Text style={styles.heroBadgeText}>{vendor?.deliveryFee === 0 ? 'Free' : `₦${vendor?.deliveryFee}`}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoStrip}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>₦{vendor?.minOrder?.toLocaleString() ?? '500'}</Text>
            <Text style={styles.infoLabel}>Min. Order</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{vendor?.distanceKm ?? '—'} km</Text>
            <Text style={styles.infoLabel}>Distance</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open Now</Text>
            </View>
            <Text style={styles.infoLabel}>Status</Text>
          </View>
        </View>

        <View style={styles.categoryNav}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryNavInner}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat} style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]} onPress={() => setActiveCategory(cat)}>
                <Text style={[styles.catBtnText, activeCategory === cat && styles.catBtnTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{activeCategory}</Text>
          <Text style={styles.menuSectionCount}>{items.length} items</Text>

          {items.map((item) =>
            item.isFeatured ? (
              <View key={item.id} style={styles.featuredItem}>
                <View style={styles.featuredImageWrap}>
                  <Image source={{ uri: item.imageURL }} style={styles.featuredImage} />
                  <View style={styles.featuredOverlay} />
                  <View style={styles.featuredTag}><Text style={styles.featuredTagText}>⭐ Chef&apos;s Pick</Text></View>
                </View>
                <View style={styles.featuredInfo}>
                  <View style={styles.featuredInfoTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featuredName}>{item.name}</Text>
                      <Text style={styles.featuredDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFav(item.id)}>
                      <Text style={[styles.favIcon, favorites.has(item.id) && styles.favIconActive]}>{favorites.has(item.id) ? '❤️' : '♡'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.featuredBottom}>
                    <Text style={styles.featuredPrice}>₦{item.price?.toLocaleString()}</Text>
                    {getQty(item.id) > 0 ? (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                        <Text style={styles.qtyValue}>{getQty(item.id)}</Text>
                        <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => handleAdd(item)}><Text style={[styles.qtyBtnText, styles.qtyBtnAddText]}>+</Text></TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)} activeOpacity={0.85}>
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                  <Text style={styles.menuItemPrice}>₦{item.price?.toLocaleString()}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  <View style={styles.menuItemImageWrap}>
                    <Image source={{ uri: item.imageURL }} style={styles.menuItemImage} />
                  </View>
                  {getQty(item.id) > 0 ? (
                    <View style={styles.qtyControlSmall}>
                      <TouchableOpacity style={styles.qtyBtnSmall} onPress={() => updateQty(item.id, -1)}><Text style={styles.qtyBtnSmallText}>−</Text></TouchableOpacity>
                      <Text style={styles.qtyValueSmall}>{getQty(item.id)}</Text>
                      <TouchableOpacity style={[styles.qtyBtnSmall, styles.qtyBtnSmallAdd]} onPress={() => handleAdd(item)}><Text style={[styles.qtyBtnSmallText, { color: Colors.onPrimary }]}>+</Text></TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.menuItemAddBtn} onPress={() => handleAdd(item)}>
                      <Text style={styles.menuItemAddIcon}>+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          )}
        </View>
      </Animated.ScrollView>

      {vendorCartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBar, { bottom: insets.bottom + 16 }]}
          onPress={() => router.push('/cart')}
          activeOpacity={0.92}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{vendorCartCount}</Text>
          </View>
          <Text style={styles.cartBarText}>View Cart · {vendor?.name}</Text>
          <Text style={styles.cartBarTotal}>₦{vendorCartTotal.toLocaleString()}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loadingScreen: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, backgroundColor: 'rgba(19,19,19,0.97)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  stickyBackBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stickyBackIcon: { fontSize: 22, color: Colors.onSurface },
  stickyTitle: { fontFamily: Typography.headlineBold, fontSize: 16, color: Colors.onSurface, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scroll: {},
  hero: { height: 320, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  heroBackBtn: { position: 'absolute', left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBackIcon: { fontSize: 20, color: '#fff' },
  heroFavBtn: { position: 'absolute', right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroFavIcon: { fontSize: 18, color: '#fff' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, gap: 6 },
  heroTitle: { fontFamily: Typography.headline, fontSize: 30, color: '#fff', letterSpacing: -0.8 },
  heroCuisine: { fontFamily: Typography.body, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  heroBadges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  heroBadgeStar: { fontSize: 11, color: '#FFD700' },
  heroBadgeIcon: { fontSize: 11 },
  heroBadgeText: { fontFamily: Typography.headlineBold, fontSize: 12, color: '#fff' },
  heroBadgeSub: { fontFamily: Typography.body, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  infoStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerLow, marginHorizontal: 20, marginTop: 16, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoValue: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  infoLabel: { fontFamily: Typography.label, fontSize: 11, color: Colors.onSurfaceVariant },
  infoDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  openDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' },
  openText: { fontFamily: Typography.headlineBold, fontSize: 13, color: '#4CAF50' },
  categoryNav: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  categoryNavInner: { gap: 8 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh, borderWidth: 1, borderColor: 'transparent' },
  catBtnActive: { backgroundColor: `${Colors.primary}18`, borderColor: `${Colors.primary}40` },
  catBtnText: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
  catBtnTextActive: { color: Colors.primary },
  menuSection: { padding: 20, gap: 14 },
  menuSectionTitle: { fontFamily: Typography.headlineBold, fontSize: 20, color: Colors.onSurface, letterSpacing: -0.3 },
  menuSectionCount: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: -8 },
  featuredItem: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  featuredImageWrap: { height: 180, position: 'relative' },
  featuredImage: { width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  featuredTag: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  featuredTagText: { fontFamily: Typography.label, fontSize: 11, color: '#FFD700' },
  featuredInfo: { padding: 16, gap: 12 },
  featuredInfoTop: { flexDirection: 'row', gap: 10 },
  featuredName: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.onSurface },
  featuredDesc: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19, marginTop: 3 },
  favIcon: { fontSize: 20, color: Colors.onSurfaceVariant },
  favIconActive: { color: '#FF4444' },
  featuredBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredPrice: { fontFamily: Typography.headline, fontSize: 20, color: Colors.primary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  addBtnText: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onPrimary },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHigh, borderRadius: 12, overflow: 'hidden' },
  qtyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: Colors.primary },
  qtyBtnText: { fontSize: 18, color: Colors.onSurface, fontWeight: '600' },
  qtyBtnAddText: { color: Colors.onPrimary },
  qtyValue: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onSurface, minWidth: 28, textAlign: 'center' },
  menuItem: { flexDirection: 'row', gap: 14, backgroundColor: Colors.surfaceContainerLow, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  menuItemLeft: { flex: 1, gap: 5, justifyContent: 'center' },
  menuItemName: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  menuItemDesc: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18 },
  menuItemPrice: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.primary, marginTop: 2 },
  menuItemRight: { alignItems: 'center', gap: 8 },
  menuItemImageWrap: { width: 90, height: 90, borderRadius: 14, overflow: 'hidden' },
  menuItemImage: { width: '100%', height: '100%' },
  menuItemAddBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  menuItemAddIcon: { fontSize: 18, color: Colors.onPrimary, fontWeight: '700' },
  qtyControlSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHigh, borderRadius: 10, overflow: 'hidden' },
  qtyBtnSmall: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnSmallAdd: { backgroundColor: Colors.primary },
  qtyBtnSmallText: { fontSize: 15, color: Colors.onSurface, fontWeight: '600' },
  qtyValueSmall: { fontFamily: Typography.headlineBold, fontSize: 12, color: Colors.onSurface, minWidth: 22, textAlign: 'center' },
  cartBar: { position: 'absolute', left: 16, right: 16, backgroundColor: Colors.tertiaryContainer, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 16 },
  cartBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onTertiaryContainer },
  cartBarText: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onTertiaryContainer, flex: 1, marginLeft: 12 },
  cartBarTotal: { fontFamily: Typography.headline, fontSize: 16, color: Colors.onTertiaryContainer },
});
