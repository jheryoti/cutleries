import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '@/constants/theme';
import { api } from '@/services/api';
import { useApp } from '@/context/AppContext';
import Toast from '@/components/Toast';

type PaymentMethod = 'wallet' | 'card' | 'bank';

const PAYMENT_OPTIONS: { id: PaymentMethod; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { id: 'wallet', icon: 'wallet-outline', title: 'Wallet', sub: 'Pay from balance' },
  { id: 'card',   icon: 'card-outline',   title: 'Card',   sub: '**** 8842' },
  { id: 'bank',   icon: 'business-outline', title: 'Bank Transfer', sub: 'Instant confirm' },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ vendorId?: string; vendorName?: string; subtotal?: string; deliveryFee?: string; total?: string }>();
  const { cartItems, clearCart, addNotification } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', message: '', type: 'success' as const });

  const vendorName = params.vendorName || 'Restaurant';
  const subtotal = parseInt(params.subtotal || '0', 10);
  const deliveryFee = parseInt(params.deliveryFee || '0', 10);
  const total = parseInt(params.total || '0', 10);
  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  const handleConfirm = async () => {
    if (!params.vendorId) return Alert.alert('Error', 'Missing vendor info');
    setLoading(true);
    try {
      const result = await api.createOrder({
        vendorId: params.vendorId,
        vendorName,
        items: cartItems.map((i) => ({ menuItemId: i.id, name: i.name, price: i.price, qty: i.qty, note: '' })),
        deliveryFee,
        paymentMethod,
        promoCode: promoCode || null,
        deliveryAddress: { label: 'Home', address: '45 Glover Road, Ikoyi, Lagos', apartment: 'Apt 4B' },
      });
      if (result.orderId) {
        clearCart();
        addNotification({ title: 'Order Placed! 🎉', message: `Your order from ${vendorName} has been confirmed.`, type: 'order' });
        addNotification({ title: 'Payment Successful', message: `${fmt(total)} charged via ${paymentMethod}.`, type: 'payment' });
        const params = new URLSearchParams({ orderId: result.orderId, orderNumber: result.orderNumber ?? '' });
        router.replace(`/tracking?${params.toString()}`);
      } else {
        Alert.alert('Order Failed', result.error || 'Something went wrong');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Toast visible={toast.visible} title={toast.title} message={toast.message} type={toast.type} onHide={() => setToast((t) => ({ ...t, visible: false }))} />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]} showsVerticalScrollIndicator={false}>

        {/* Delivery address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity><Text style={styles.editText}>Edit</Text></TouchableOpacity>
          </View>
          <View style={styles.addressCard}>
            <View style={styles.addressIconWrap}>
              <Ionicons name="home-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Home</Text>
              <Text style={styles.addressText}>45 Glover Road, Ikoyi, Lagos{'\n'}Apt 4B, Blue Water Towers</Text>
            </View>
            <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {PAYMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.paymentOption, paymentMethod === opt.id && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod(opt.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={opt.icon} size={22} color={paymentMethod === opt.id ? Colors.primary : Colors.onSurfaceVariant} />
                <View style={styles.paymentOptionInfo}>
                  <Text style={styles.paymentOptionTitle}>{opt.title}</Text>
                  <Text style={styles.paymentOptionSub}>{opt.sub}</Text>
                </View>
                <View style={[styles.radioOuter, paymentMethod === opt.id && styles.radioOuterActive]}>
                  {paymentMethod === opt.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoRow}>
            <View style={styles.promoInputWrap}>
              <Ionicons name="gift-outline" size={18} color={Colors.onSurfaceVariant} />
              <TextInput style={styles.promoInput} placeholder="Enter promo code" placeholderTextColor={Colors.onSurfaceVariant} value={promoCode} onChangeText={setPromoCode} autoCapitalize="characters" />
            </View>
            <TouchableOpacity style={styles.applyBtn}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
          </View>
        </View>

        {/* Order items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsCard}>
            {cartItems.map((item, index) => (
              <View key={item.id}>
                <View style={styles.orderItem}>
                  <View style={styles.orderItemQty}><Text style={styles.orderItemQtyText}>{item.qty}×</Text></View>
                  <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.orderItemPrice}>{fmt(item.price * item.qty)}</Text>
                </View>
                {index < cartItems.length - 1 && <View style={styles.itemDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Breakdown</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Subtotal</Text><Text style={styles.summaryVal}>{fmt(subtotal)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Delivery Fee</Text><Text style={styles.summaryVal}>{deliveryFee === 0 ? 'Free' : fmt(deliveryFee)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Service Fee</Text><Text style={styles.summaryVal}>{fmt(150)}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.totalKey}>Total</Text><Text style={styles.totalVal}>{fmt(total)}</Text></View>
        </View>

        {/* ETA */}
        <View style={styles.etaCard}>
          <View style={styles.etaLeft}>
            <View style={styles.etaDot} />
            <View>
              <Text style={styles.etaTitle}>Estimated Delivery</Text>
              <Text style={styles.etaTime}>24–32 minutes</Text>
            </View>
          </View>
          <Text style={{ fontSize: 28 }}>🛵</Text>
        </View>
      </ScrollView>

      {/* Confirm bar */}
      <View style={[styles.confirmBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.confirmBarTop}>
          <Text style={styles.confirmBarLabel}>Total Amount</Text>
          <Text style={styles.confirmBarTotal}>{fmt(total)}</Text>
        </View>
        <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handleConfirm} activeOpacity={0.88} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.onTertiaryContainer} /> : <><Text style={styles.confirmBtnText}>Place Order</Text><Ionicons name="arrow-forward" size={18} color={Colors.onTertiaryContainer} /></>}
        </TouchableOpacity>
        <View style={styles.secureRow}>
          <Ionicons name="lock-closed" size={11} color={Colors.outline} />
          <Text style={styles.secureText}>Secured with 256-bit encryption</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Typography.headlineBold, fontSize: 18, color: Colors.onSurface },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.onSurface },
  editText: { fontFamily: Typography.label, fontSize: 12, color: Colors.primary },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  addressIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  addressInfo: { flex: 1 },
  addressLabel: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onSurface },
  addressText: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18, marginTop: 2 },
  defaultBadge: { backgroundColor: `${Colors.primary}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  defaultBadgeText: { fontFamily: Typography.label, fontSize: 10, color: Colors.primary },
  paymentOptions: { gap: 10 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}08` },
  paymentOptionInfo: { flex: 1 },
  paymentOptionTitle: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  paymentOptionSub: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.outline, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  promoInput: { flex: 1, fontFamily: Typography.body, fontSize: 14, color: Colors.onSurface },
  applyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onPrimary },
  itemsCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  orderItemQty: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  orderItemQtyText: { fontFamily: Typography.headlineBold, fontSize: 12, color: Colors.primary },
  orderItemName: { flex: 1, fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.onSurface },
  orderItemPrice: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onSurface },
  itemDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 14 },
  summaryCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  summaryTitle: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontFamily: Typography.body, fontSize: 14, color: Colors.onSurfaceVariant },
  summaryVal: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.onSurface },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  totalKey: { fontFamily: Typography.headlineBold, fontSize: 16, color: Colors.onSurface },
  totalVal: { fontFamily: Typography.headline, fontSize: 18, color: Colors.onSurface },
  etaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${Colors.primary}10`, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${Colors.primary}20` },
  etaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  etaDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  etaTitle: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.onSurface },
  etaTime: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.primary, marginTop: 2 },
  confirmBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, backgroundColor: 'rgba(19,19,19,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', gap: 12 },
  confirmBarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmBarLabel: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  confirmBarTotal: { fontFamily: Typography.headline, fontSize: 22, color: Colors.onSurface, letterSpacing: -0.5 },
  confirmBtn: { backgroundColor: Colors.tertiaryContainer, borderRadius: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  confirmBtnText: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.onTertiaryContainer },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  secureText: { fontFamily: Typography.label, fontSize: 10, color: Colors.outline, letterSpacing: 0.3 },
});
