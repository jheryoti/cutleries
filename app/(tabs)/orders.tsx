import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { api } from '@/services/api';
import { useApp } from '@/context/AppContext';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  delivered:  { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)',  label: 'Delivered',   icon: '✓' },
  preparing:  { color: Colors.primary, bg: `${Colors.primary}15`, label: 'Preparing',   icon: '👨‍🍳' },
  on_the_way: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)', label: 'On the way',  icon: '🛵' },
  cancelled:  { color: Colors.error, bg: `${Colors.error}15`,  label: 'Cancelled',   icon: '✕' },
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { addNotification } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    api.getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));
  const displayed = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSub}>Track and manage your orders</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
            {activeOrders.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{activeOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.emptyText}>Loading orders...</Text>
          </View>
        ) : displayed.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>{activeTab === 'active' ? '🍽️' : '📋'}</Text>
            <Text style={styles.emptyTitle}>{activeTab === 'active' ? 'No active orders' : 'No past orders'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'Your current orders will appear here' : 'Your order history will appear here'}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity style={styles.orderNowBtn} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.orderNowText}>Browse Restaurants</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayed.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.preparing;
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/tracking?orderId=${order.id}`)}
                activeOpacity={0.88}
              >
                <View style={styles.orderCardTop}>
                  <View style={styles.orderVendorRow}>
                    <View style={styles.orderIconWrap}>
                      <Text style={styles.orderIcon}>🍽️</Text>
                    </View>
                    <View style={styles.orderVendorInfo}>
                      <Text style={styles.orderVendor}>{order.vendorName}</Text>
                      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={styles.statusIcon}>{cfg.icon}</Text>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                <Text style={styles.orderItems} numberOfLines={1}>
                  {order.items?.map((i: any) => i.name).join(' · ')}
                </Text>

                <View style={styles.orderCardBottom}>
                  <Text style={styles.orderDate}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}
                  </Text>
                  <View style={styles.orderTotalRow}>
                    <Text style={styles.orderTotal}>₦{order.total?.toLocaleString()}</Text>
                    {activeTab === 'active' && (
                      <View style={styles.trackBtn}>
                        <Text style={styles.trackBtnText}>Track →</Text>
                      </View>
                    )}
                    {activeTab === 'past' && order.status === 'delivered' && (
                      <TouchableOpacity style={styles.reorderBtn} onPress={() => {
                        addNotification({ title: 'Reorder Placed! 🔄', message: `Reordering from ${order.vendorName}.`, type: 'order' });
                        router.push('/(tabs)');
                      }}>
                        <Text style={styles.reorderBtnText}>Reorder</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: { paddingHorizontal: 20, paddingBottom: 0, gap: 4, backgroundColor: Colors.surface },
  headerTitle: { fontFamily: Typography.headline, fontSize: 28, color: Colors.onSurface, letterSpacing: -0.5 },
  headerSub: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },

  tabRow: { flexDirection: 'row', gap: 4, marginTop: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingBottom: 12, marginRight: 16 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.primary, fontFamily: Typography.headlineBold },
  tabBadge: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tabBadgeText: { fontFamily: Typography.label, fontSize: 10, color: Colors.onPrimary },

  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },

  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontFamily: Typography.headlineBold, fontSize: 18, color: Colors.onSurface },
  emptyText: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },
  orderNowBtn: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  orderNowText: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onPrimary },

  orderCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20, padding: 18, gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderVendorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  orderIcon: { fontSize: 20 },
  orderVendorInfo: { gap: 2 },
  orderVendor: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  orderNumber: { fontFamily: Typography.label, fontSize: 11, color: Colors.onSurfaceVariant },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  statusIcon: { fontSize: 11 },
  statusText: { fontFamily: Typography.label, fontSize: 11, letterSpacing: 0.3 },

  orderDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  orderItems: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },

  orderCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontFamily: Typography.label, fontSize: 11, color: Colors.outline },
  orderTotalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderTotal: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  trackBtn: { backgroundColor: `${Colors.primary}20`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  trackBtnText: { fontFamily: Typography.label, fontSize: 11, color: Colors.primary },
  reorderBtn: { backgroundColor: Colors.surfaceContainerHigh, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  reorderBtnText: { fontFamily: Typography.label, fontSize: 11, color: Colors.onSurface },
});
