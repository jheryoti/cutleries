import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Radius } from '@/constants/theme';
import { api } from '@/services/api';

const RECENT_CONTACTS = [
  { id: 'new', username: 'New', image: null, isNew: true },
  { id: '1', username: '@Tayo', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', active: true },
  { id: '2', username: '@Bolaji', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { id: '3', username: '@Chidi', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
];

export default function SendMoneyScreen() {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('2000');
  const [recipient, setRecipient] = useState('Tayo_Design');
  const [activeContact, setActiveContact] = useState('1');
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const pingAnim = useRef(new Animated.Value(1)).current;

  const handleConfirm = async () => {
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) return Alert.alert('Error', 'Enter a valid amount');
    if (!recipient) return Alert.alert('Error', 'Enter a recipient username');
    try {
      const result = await api.sendMoney(recipient, amt);
      if (result.error) return Alert.alert('Transfer Failed', result.error);
      setShowSuccess(true);
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pingAnim, { toValue: 2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pingAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: Colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={styles.avatar}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }} style={styles.avatarImg} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>RECIPIENT INFORMATION</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>@</Text>
            <TextInput style={styles.input} value={recipient} onChangeText={setRecipient} placeholder="Recipient Username" placeholderTextColor={`${Colors.onSurfaceVariant}80`} autoCapitalize="none" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsRow}>
            {RECENT_CONTACTS.map((contact) => (
              <TouchableOpacity key={contact.id} style={styles.contactItem} onPress={() => !contact.isNew && setActiveContact(contact.id)} activeOpacity={0.8}>
                {contact.isNew ? (
                  <View style={styles.newContactCircle}>
                    <Text style={styles.newContactIcon}>+</Text>
                  </View>
                ) : (
                  <View style={[styles.contactAvatarWrap, activeContact === contact.id && styles.contactAvatarActive]}>
                    <Image source={{ uri: contact.image! }} style={styles.contactAvatar} />
                  </View>
                )}
                <Text style={[styles.contactName, activeContact === contact.id && styles.contactNameActive]}>
                  {contact.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.fieldLabel}>TRANSFER AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.surfaceContainerHighest} />
          </View>
          <View style={styles.availablePill}>
            <Text style={styles.availableText}>Available: ₦145,200.00</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.88}>
            <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
            <Text style={styles.confirmBtnIcon}>↗</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            By confirming, you authorize the immediate transfer of funds. This action cannot be undone.
          </Text>
        </View>
      </ScrollView>

      {showSuccess && (
        <View style={[styles.successOverlay, { paddingTop: insets.top }]}>
          <Animated.View style={[styles.successContent, { transform: [{ scale: successScale }] }]}>
            <View style={styles.successIconWrap}>
              <Animated.View style={[styles.successPing, { transform: [{ scale: pingAnim }] }]} />
              <View style={styles.successCircle}>
                <Text style={styles.successCheckmark}>✓</Text>
              </View>
            </View>
            <Text style={styles.successTitle}>Payment Successful</Text>
            <Text style={styles.successSubtitle}>₦{parseInt(amount).toLocaleString()} sent to @{recipient}</Text>
            <View style={styles.txCard}>
              <View style={styles.txRow}>
                <Text style={styles.txKey}>Transaction ID</Text>
                <Text style={styles.txVal}>#TRX-9921-00X</Text>
              </View>
              <View style={styles.txRow}>
                <Text style={styles.txKey}>Date</Text>
                <Text style={styles.txVal}>24 Oct, 2024 • 14:22</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.backToWalletBtn} onPress={() => { setShowSuccess(false); router.back(); }} activeOpacity={0.85}>
              <Text style={styles.backToWalletText}>Back to Wallet</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16, backgroundColor: 'rgba(19,19,19,0.9)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22 },
  headerTitle: { fontFamily: Typography.headlineBold, fontSize: 18, color: Colors.onSurface },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.outlineVariant}30` },
  avatarImg: { width: '100%', height: '100%' },
  scroll: { paddingHorizontal: 24, paddingTop: 32, gap: 36 },
  section: { gap: 16 },
  fieldLabel: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 18 },
  inputIcon: { fontSize: 18, color: `${Colors.primary}80`, fontWeight: '700' },
  input: { flex: 1, fontFamily: Typography.bodyMedium, fontSize: 16, color: Colors.onSurface },
  contactsRow: { gap: 16, paddingVertical: 8 },
  contactItem: { alignItems: 'center', gap: 6 },
  newContactCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: `${Colors.primary}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.primary}30` },
  newContactIcon: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  contactAvatarWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  contactAvatarActive: { borderColor: Colors.primary },
  contactAvatar: { width: '100%', height: '100%' },
  contactName: { fontFamily: Typography.label, fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 1 },
  contactNameActive: { color: Colors.primary, fontFamily: Typography.headlineBold },
  amountSection: { alignItems: 'center', gap: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  currencySymbol: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 36, color: `${Colors.primary}60` },
  amountInput: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 64, color: Colors.onSurface, letterSpacing: -2, minWidth: 120, textAlign: 'center' },
  availablePill: { backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  availableText: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 12, boxShadow: '0px 12px 24px rgba(0,0,0,0.3)' },
  confirmBtnText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 17, color: Colors.onPrimary },
  confirmBtnIcon: { fontSize: 20, color: Colors.onPrimary },
  disclaimer: { fontFamily: Typography.body, fontSize: 12, color: `${Colors.onSurfaceVariant}80`, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successContent: { width: '100%', maxWidth: 360, alignItems: 'center', gap: 28 },
  successIconWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  successPing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.primary, opacity: 0.15 },
  successCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 16, boxShadow: '0px 0px 24px rgba(118,214,213,0.3)' },
  successCheckmark: { fontSize: 40, color: Colors.onPrimary, fontWeight: '700' },
  successTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: Colors.onSurface, letterSpacing: -1, textAlign: 'center' },
  successSubtitle: { fontFamily: Typography.bodySemiBold, fontSize: 18, color: Colors.primary, textAlign: 'center' },
  txCard: { width: '100%', backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xxl, padding: 24, gap: 16, borderWidth: 1, borderColor: `${Colors.outlineVariant}18` },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txKey: { fontFamily: Typography.body, fontSize: 14, color: Colors.onSurfaceVariant },
  txVal: { fontFamily: 'monospace', fontSize: 12, color: Colors.onSurface },
  backToWalletBtn: { width: '100%', backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, paddingVertical: 16, alignItems: 'center' },
  backToWalletText: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
});
