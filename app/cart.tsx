import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const SERVICE_FEE = 150;

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { cartItems, cartVendorId, cartVendorName, updateQty, removeFromCart, cartTotal } = useApp();

  const deliveryFee = 500;
  const total = cartTotal + deliveryFee + SERVICE_FEE;
  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  const handleCheckout = () => {
    const params = new URLSearchParams({
      vendorId: cartVendorId ?? '',
      vendorName: cartVendorName ?? '',
      subtotal: cartTotal.toString(),
      deliveryFee: deliveryFee.toString(),
      total: total.toString(),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSub}>{cartVendorName || 'Restaurant'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.itemCount}>{cartItems.reduce((s, i) => s + i.qty, 0)} items</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Add items from a restaurant to get started</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.back()}>
              <Text style={styles.browseBtnText}>Browse Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.itemsCard}>
              {cartItems.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.cartItem}>
                    <View style={styles.itemImageWrap}>
                      {item.imageURL
                        ? <Image source={{ uri: item.imageURL }} style={styles.itemImage} />
                        : <View style={[styles.itemImage, styles.itemImagePlaceholder]} />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>{fmt(item.price)}</Text>
                    </View>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.qty}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => updateQty(item.id, 1)}>
                        <Text style={[styles.qtyBtnText, styles.qtyBtnAddText]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {index < cartItems.length - 1 && <View style={styles.itemDivider} />}
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.back()} activeOpacity={0.75}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addMoreText}>Add more items</Text>
            </TouchableOpacity>

            {/* Address */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <TouchableOpacity><Text style={styles.changeText}>Change</Text></TouchableOpacity>
              </View>
              <View style={styles.addressCard}>
                <View style={styles.addressIconWrap}>
                  <Ionicons name="home-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Home</Text>
                  <Text style={styles.addressText}>45 Glover Road, Ikoyi, Lagos</Text>
                </View>
                <View style={styles.addressBadge}><Text style={styles.addressBadgeText}>Default</Text></View>
              </View>
            </View>

            {/* Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Subtotal</Text><Text style={styles.summaryVal}>{fmt(cartTotal)}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryKey}>Delivery Fee</Text><Text style={styles.summaryVal}>{fmt(deliveryFee)}</Text></View>
                <View style={styles.summaryRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={styles.summaryKey}>Service Fee</Text>
                    <Ionicons name="information-circle-outline" size={13} color={Colors.onSurfaceVariant} />
                  </View>
                  <Text style={styles.summaryVal}>{fmt(SERVICE_FEE)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}><Text style={styles.totalKey}>Total</Text><Text style={styles.totalVal}>{fmt(total)}</Text></View>
              </View>
            </View>

            <View style={styles.etaRow}>
              <View style={styles.etaDot} />
              <Text style={styles.etaText}>Estimated delivery: 25–35 minutes</Text>
            </View>
          </>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.88}>
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <View style={styles.checkoutRight}>
              <Text style={styles.checkoutTotal}>{fmt(total)}</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.onTertiaryContainer} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.onSurface },
  headerSub: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  itemCount: { fontFamily: Typography.label, fontSize: 11, color: Colors.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontFamily: Typography.headlineBold, fontSize: 20, color: Colors.onSurface },
  emptyText: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },
  browseBtn: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onPrimary },
  itemsCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  cartItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  itemImageWrap: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemImagePlaceholder: { backgroundColor: Colors.surfaceContainerHigh },
  itemInfo: { flex: 1, gap: 5 },
  itemName: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  itemPrice: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.primary },
  itemDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHigh, borderRadius: 12, overflow: 'hidden' },
  qtyBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: Colors.primary },
  qtyBtnText: { fontSize: 17, color: Colors.onSurface, fontWeight: '600' },
  qtyBtnAddText: { color: Colors.onPrimary },
  qtyValue: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onSurface, minWidth: 26, textAlign: 'center' },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: `${Colors.primary}30`, borderRadius: 14, paddingVertical: 12 },
  addMoreText: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.primary },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.onSurface },
  changeText: { fontFamily: Typography.label, fontSize: 12, color: Colors.primary },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  addressIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  addressInfo: { flex: 1 },
  addressLabel: { fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onSurface },
  addressText: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  addressBadge: { backgroundColor: `${Colors.primary}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  addressBadgeText: { fontFamily: Typography.label, fontSize: 10, color: Colors.primary },
  summaryCard: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey: { fontFamily: Typography.body, fontSize: 14, color: Colors.onSurfaceVariant },
  summaryVal: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.onSurface },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  totalKey: { fontFamily: Typography.headlineBold, fontSize: 16, color: Colors.onSurface },
  totalVal: { fontFamily: Typography.headline, fontSize: 18, color: Colors.onSurface },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  etaDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' },
  etaText: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  checkoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 14, backgroundColor: 'rgba(19,19,19,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  checkoutBtn: { backgroundColor: Colors.tertiaryContainer, borderRadius: 18, paddingVertical: 17, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkoutBtnText: { fontFamily: Typography.headlineBold, fontSize: 16, color: Colors.onTertiaryContainer },
  checkoutRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkoutTotal: { fontFamily: Typography.headlineBold, fontSize: 15, color: `${Colors.onTertiaryContainer}CC` },
});
