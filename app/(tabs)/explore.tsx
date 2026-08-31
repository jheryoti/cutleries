import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { api } from '@/services/api';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    Promise.all([api.getVendors(), api.getCategories()])
      .then(([v, c]) => { setVendors(Array.isArray(v) ? v : []); setCategories(Array.isArray(c) ? c : []); })
      .catch(() => { setVendors([]); setCategories([]); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) => {
    const matchSearch = !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.cuisine?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || v.categoryId === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSub}>Discover restaurants near you</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
          <TouchableOpacity
            style={[styles.catChip, !activeCategory && styles.catChipActive]}
            onPress={() => setActiveCategory('')}
          >
            <Text style={[styles.catChipText, !activeCategory && styles.catChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
              onPress={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
            >
              <Text style={styles.catEmoji}>{cat.icon}</Text>
              <Text style={[styles.catChipText, activeCategory === cat.id && styles.catChipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.resultsCount}>{filtered.length} restaurants found</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try a different search or category</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                style={styles.gridCard}
                onPress={() => router.push(`/vendor/${vendor.id}`)}
                activeOpacity={0.88}
              >
                <View style={styles.gridImageWrap}>
                  <Image source={{ uri: vendor.imageURL }} style={styles.gridImage} />
                  <View style={styles.gridOverlay} />
                  <View style={styles.gridRating}>
                    <Text style={styles.gridRatingStar}>★</Text>
                    <Text style={styles.gridRatingText}>{vendor.rating}</Text>
                  </View>
                </View>
                <View style={styles.gridInfo}>
                  <Text style={styles.gridName} numberOfLines={1}>{vendor.name}</Text>
                  <Text style={styles.gridCuisine} numberOfLines={1}>{vendor.cuisine}</Text>
                  <View style={styles.gridMeta}>
                    <Text style={styles.gridMetaText}>🕐 {vendor.deliveryTimeMin}–{vendor.deliveryTimeMax}m</Text>
                    <Text style={styles.gridMetaDot}>·</Text>
                    <Text style={styles.gridMetaText}>{vendor.deliveryFee === 0 ? '🛵 Free' : `🛵 ₦${vendor.deliveryFee}`}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  headerTitle: { fontFamily: Typography.headline, fontSize: 28, color: Colors.onSurface, letterSpacing: -0.5 },
  headerSub: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontFamily: Typography.body, fontSize: 14, color: Colors.onSurface },
  clearIcon: { fontSize: 14, color: Colors.onSurfaceVariant, padding: 2 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  catsRow: { gap: 8, paddingRight: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  catChipActive: { backgroundColor: `${Colors.primary}18`, borderColor: `${Colors.primary}40` },
  catEmoji: { fontSize: 15 },
  catChipText: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
  catChipTextActive: { color: Colors.primary },
  resultsCount: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: Typography.headlineBold, fontSize: 18, color: Colors.onSurface },
  emptyText: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCard: {
    width: '47%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  gridImageWrap: { height: 120, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  gridRating: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  gridRatingStar: { fontSize: 10, color: '#FFD700' },
  gridRatingText: { fontFamily: Typography.headlineBold, fontSize: 11, color: '#fff' },
  gridInfo: { padding: 12, gap: 4 },
  gridName: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onSurface },
  gridCuisine: { fontFamily: Typography.body, fontSize: 11, color: Colors.onSurfaceVariant },
  gridMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  gridMetaText: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant },
  gridMetaDot: { color: Colors.outline, fontSize: 10 },
});
