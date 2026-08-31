import { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Radius } from '@/constants/theme';
import { api } from '@/services/api';

const STATUS_STEPS: Record<string, number> = { pending: 0, confirmed: 1, cooking: 2, in_transit: 3, delivered: 4 };
const STATUS_EMOJI: Record<string, string> = { pending: '⏳', confirmed: '✅', cooking: '🍳', in_transit: '🛵', delivered: '🏠' };

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId?: string; orderNumber?: string }>();
  const [order, setOrder] = useState<any>(null);
  const pingAnim = useRef(new Animated.Value(1)).current;
  const riderX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pingAnim, { toValue: 2.4, duration: 1000, useNativeDriver: true }),
      Animated.timing(pingAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(riderX, { toValue: 12, duration: 2000, useNativeDriver: true }),
      Animated.timing(riderX, { toValue: -12, duration: 2000, useNativeDriver: true }),
    ])).start();

    if (orderId) {
      api.getOrder(orderId).then(setOrder).catch(() => setOrder(null));
      // Poll every 10s for status updates
      const interval = setInterval(() => api.getOrder(orderId).then(setOrder).catch(() => {}), 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const status = order?.status || 'confirmed';
  const stepsFilled = STATUS_STEPS[status] ?? 1;
  const totalSteps = 3;

  return (
    <View style={styles.container}>
      <View style={styles.mapCanvas}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80' }} style={styles.mapImage} />
        <View style={styles.mapOverlay} />
        <View style={styles.routeLine}>
          {Array.from({ length: 12 }).map((_, i) => <View key={i} style={styles.routeDash} />)}
        </View>
        <Animated.View style={[styles.riderMarker, { transform: [{ translateX: riderX }] }]}>
          <View style={styles.riderGlow} />
          <View style={styles.riderCircle}>
            <Text style={styles.riderEmoji}>🛵</Text>
          </View>
          <View style={styles.riderPill}>
            <View style={styles.riderPillDot} />
            <Text style={styles.riderPillText}>RIDER ON THE WAY</Text>
          </View>
        </Animated.View>
        <View style={styles.destinationMarker}>
          <View style={styles.destinationCircle}>
            <Text style={styles.destinationEmoji}>🏠</Text>
          </View>
        </View>
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerCity}>Lagos, NG</Text>
          <Text style={styles.headerOrder}>Order #{order?.orderNumber || orderNumber}</Text>
        </View>
        <View style={styles.avatar}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }} style={styles.avatarImg} />
        </View>
      </View>

      <View style={[styles.livePill, { top: insets.top + 76 }]}>
        <View style={styles.livePillInner}>
          <Animated.View style={[styles.livePing, { transform: [{ scale: pingAnim }] }]} />
          <View style={styles.liveDot} />
        </View>
        <Text style={styles.livePillText}>LIVE TRACKING</Text>
      </View>

      <View style={[styles.deliveryCard, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.etaRow}>
          <View>
            <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
            <View style={styles.etaValueRow}>
              <Text style={styles.etaNumber}>{order?.estimatedDeliveryMins || 30}</Text>
              <Text style={styles.etaUnit}>mins</Text>
            </View>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusEmoji}>{STATUS_EMOJI[status] || '🍳'}</Text>
            <Text style={styles.statusLabel}>{status.toUpperCase().replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.progressSegment, i < stepsFilled ? styles.progressFilled : styles.progressEmpty]} />
          ))}
        </View>

        <View style={styles.riderCard}>
          <View style={styles.riderInfo}>
            <View style={styles.riderAvatarWrap}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' }} style={styles.riderAvatar} />
              <View style={styles.riderStarBadge}>
                <Text style={styles.riderStarIcon}>★</Text>
              </View>
            </View>
            <View>
              <Text style={styles.riderName}>{order?.rider?.name || 'Assigning rider...'}</Text>
              <View style={styles.riderMeta}>
                <Text style={styles.riderVehicle}>{order?.rider?.vehicle || ''}</Text>
                {order?.rider?.rating && <><View style={styles.riderDot} /><Text style={styles.riderRating}>{order.rider.rating} Rating</Text></>}
              </View>
            </View>
          </View>
          <View style={styles.riderActions}>
            <TouchableOpacity style={styles.riderActionBtn}>
              <Text style={styles.riderActionIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.riderActionBtn, styles.riderCallBtn]}>
              <Text style={styles.riderActionIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.orderPreview}>
          <View style={styles.orderPreviewHeader}>
            <Text style={styles.orderPreviewTitle}>Your Selection</Text>
            <TouchableOpacity><Text style={styles.viewDetailsText}>VIEW DETAILS</Text></TouchableOpacity>
          </View>
          <View style={styles.orderPreviewItem}>
            <View style={styles.orderPreviewImageWrap}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80' }} style={styles.orderPreviewImage} />
            </View>
            <View style={styles.orderPreviewInfo}>
              <Text style={styles.orderPreviewName}>{order?.items?.[0]?.name || 'Your order'}</Text>
              <Text style={styles.orderPreviewNote}>{order?.vendorName?.toUpperCase()}</Text>
            </View>
            <Text style={styles.orderPreviewPrice}>{order?.total ? `₦${order.total.toLocaleString()}` : ''}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  mapCanvas: { ...StyleSheet.absoluteFillObject },
  mapImage: { width: '100%', height: '100%', opacity: 0.35 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19,19,19,0.5)' },
  routeLine: { position: 'absolute', top: '35%', left: '20%', flexDirection: 'row', gap: 8, alignItems: 'center' },
  routeDash: { width: 16, height: 3, borderRadius: 2, backgroundColor: Colors.primary, opacity: 0.5 },
  riderMarker: { position: 'absolute', top: '42%', left: '35%', alignItems: 'center', gap: 8 },
  riderGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, opacity: 0.2 },
  riderCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: Colors.surface, elevation: 12, boxShadow: '0px 0px 12px rgba(118,214,213,0.5)' },
  riderEmoji: { fontSize: 24 },
  riderPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.outlineVariant}30` },
  riderPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  riderPillText: { fontFamily: Typography.label, fontSize: 9, color: Colors.primary, letterSpacing: 2 },
  destinationMarker: { position: 'absolute', top: '28%', left: '58%' },
  destinationCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.primary}30` },
  destinationEmoji: { fontSize: 22 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16, backgroundColor: 'rgba(19,19,19,0.8)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.onSurface },
  headerCity: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.primary },
  headerOrder: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 2, marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: Colors.primaryContainer },
  avatarImg: { width: '100%', height: '100%' },
  livePill: { position: 'absolute', left: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(19,19,19,0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  livePillInner: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  livePing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, opacity: 0.4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, elevation: 6, boxShadow: '0px 0px 6px rgba(118,214,213,0.8)' },
  livePillText: { fontFamily: Typography.label, fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 2 },
  deliveryCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(28,27,27,0.96)', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  etaLabel: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 3, marginBottom: 4 },
  etaValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  etaNumber: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 52, color: Colors.onSurface, letterSpacing: -2 },
  etaUnit: { fontFamily: Typography.headlineBold, fontSize: 22, color: Colors.primary },
  statusCard: { backgroundColor: Colors.surfaceContainerHigh, padding: 16, borderRadius: Radius.xxl, alignItems: 'center', gap: 4 },
  statusEmoji: { fontSize: 28 },
  statusLabel: { fontFamily: Typography.label, fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 2 },
  progressBar: { flexDirection: 'row', gap: 6 },
  progressSegment: { flex: 1, height: 6, borderRadius: 3 },
  progressFilled: { backgroundColor: Colors.primary },
  progressEmpty: { backgroundColor: Colors.surfaceContainerHighest },
  riderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${Colors.surfaceContainerHigh}80`, borderRadius: 28, padding: 16, borderWidth: 1, borderColor: `${Colors.outlineVariant}18` },
  riderInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  riderAvatarWrap: { position: 'relative' },
  riderAvatar: { width: 52, height: 52, borderRadius: 14, borderWidth: 2, borderColor: `${Colors.primary}30` },
  riderStarBadge: { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.surfaceContainerHigh },
  riderStarIcon: { fontSize: 9, color: Colors.primary },
  riderName: { fontFamily: Typography.headlineBold, fontSize: 16, color: Colors.onSurface },
  riderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  riderVehicle: { fontFamily: Typography.body, fontSize: 11, color: Colors.onSurfaceVariant },
  riderDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.outlineVariant },
  riderRating: { fontFamily: Typography.headlineBold, fontSize: 11, color: Colors.primary },
  riderActions: { flexDirection: 'row', gap: 8 },
  riderActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.outlineVariant}30` },
  riderCallBtn: { backgroundColor: Colors.primaryContainer },
  riderActionIcon: { fontSize: 18 },
  orderPreview: { gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: `${Colors.outlineVariant}18` },
  orderPreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderPreviewTitle: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  viewDetailsText: { fontFamily: Typography.label, fontSize: 10, color: Colors.primary, letterSpacing: 2 },
  orderPreviewItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderPreviewImageWrap: { width: 40, height: 40, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.surfaceContainerHighest },
  orderPreviewImage: { width: '100%', height: '100%' },
  orderPreviewInfo: { flex: 1 },
  orderPreviewName: { fontFamily: Typography.headlineBold, fontSize: 13, color: Colors.onSurface },
  orderPreviewNote: { fontFamily: Typography.label, fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 1, marginTop: 2 },
  orderPreviewPrice: { fontFamily: Typography.headlineBold, fontSize: 13, color: Colors.onSurface },
});
