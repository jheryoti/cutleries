import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { api } from '@/services/api';
import { useApp } from '@/context/AppContext';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { walletBalance, setWalletBalance, addNotification } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getWalletBalance(), api.getTransactions()])
      .then(([b, txs]) => {
        setWalletBalance(b.walletBalance ?? 0);
        setTransactions(Array.isArray(txs) ? txs : []);
      })
      .catch(() => {
        setWalletBalance(0);
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  const handleTopUp = (method: string) => {
    Alert.alert('Add Money', `Top up via ${method}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm ₦5,000',
        onPress: async () => {
          try {
            const result = await api.topUpWallet(5000, method === 'Bank Transfer' ? 'bank' : 'card');
            if (result.newBalance !== undefined) {
              setWalletBalance(result.newBalance);
              addNotification({ title: 'Wallet Funded 💰', message: `₦5,000 added via ${method}.`, type: 'payment' });
            }
          } catch {}
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/notifications')}>
          <Ionicons name="time-outline" size={16} color={Colors.onSurface} />
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>

        {/* Balance card */}
        <LinearGradient colors={['#005f5f', '#008080', '#00a0a0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
          <View style={styles.cardDecor1} />
          <View style={styles.cardDecor2} />
          <View style={styles.balanceTop}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{loading ? '—' : fmt(walletBalance)}</Text>
            </View>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet" size={26} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleTopUp('Bank Transfer')} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.cardActionText}>Add Money</Text>
            </TouchableOpacity>
            <View style={styles.cardActionDivider} />
            <TouchableOpacity style={styles.cardActionBtn} onPress={() => router.push('/send-money')} activeOpacity={0.85}>
              <Ionicons name="arrow-up" size={18} color="#fff" />
              <Text style={styles.cardActionText}>Send Money</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'business-outline' as const, label: 'Bank Transfer', sub: 'Instant' },
            { icon: 'card-outline' as const, label: 'Card', sub: 'Secure' },
            { icon: 'phone-portrait-outline' as const, label: 'USSD', sub: 'Offline' },
            { icon: 'gift-outline' as const, label: 'Voucher', sub: 'Redeem' },
          ].map((action) => (
            <TouchableOpacity key={action.label} style={styles.quickAction} onPress={() => handleTopUp(action.label)} activeOpacity={0.75}>
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <Text style={styles.quickActionSub}>{action.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions */}
        <View style={styles.txSection}>
          <View style={styles.txHeader}>
            <Text style={styles.txTitle}>Recent Transactions</Text>
            <TouchableOpacity><Text style={styles.viewAll}>See all</Text></TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}><ActivityIndicator color={Colors.primary} /></View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={40} color={Colors.outline} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.map((tx, index) => (
                <View key={tx.id}>
                  <View style={styles.txRow}>
                    <View style={[styles.txIconWrap, { backgroundColor: tx.type === 'credit' ? `${Colors.primary}18` : `${Colors.tertiaryContainer}18` }]}>
                      <Ionicons name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={18} color={tx.type === 'credit' ? Colors.primary : Colors.tertiary} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txName}>{tx.title}</Text>
                      <Text style={styles.txRef}>{tx.reference}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, tx.type === 'credit' ? styles.txCredit : styles.txDebit]}>
                        {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                      </Text>
                      <Text style={styles.txStatus}>{tx.status}</Text>
                    </View>
                  </View>
                  {index < transactions.length - 1 && <View style={styles.txDivider} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontFamily: Typography.headline, fontSize: 28, color: Colors.onSurface, letterSpacing: -0.5 },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  historyBtnText: { fontFamily: Typography.label, fontSize: 12, color: Colors.onSurface },
  scroll: { paddingHorizontal: 20, gap: 24 },
  balanceCard: { borderRadius: 28, padding: 28, overflow: 'hidden', gap: 24 },
  cardDecor1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
  cardDecor2: { position: 'absolute', bottom: -20, left: 60, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { fontFamily: Typography.label, fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 6 },
  balanceAmount: { fontFamily: Typography.headline, fontSize: 40, color: '#fff', letterSpacing: -1 },
  walletIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cardActions: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, overflow: 'hidden' },
  cardActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  cardActionDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  cardActionText: { fontFamily: Typography.headlineBold, fontSize: 14, color: '#fff' },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quickActionLabel: { fontFamily: Typography.bodyMedium, fontSize: 12, color: Colors.onSurface, textAlign: 'center' },
  quickActionSub: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant },
  txSection: { gap: 16 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txTitle: { fontFamily: Typography.headlineBold, fontSize: 18, color: Colors.onSurface },
  viewAll: { fontFamily: Typography.bodySemiBold, fontSize: 13, color: Colors.primary },
  loadingWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  txList: { backgroundColor: Colors.surfaceContainerLow, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  txIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 3 },
  txName: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.onSurface },
  txRef: { fontFamily: Typography.label, fontSize: 11, color: Colors.onSurfaceVariant },
  txRight: { alignItems: 'flex-end', gap: 3 },
  txAmount: { fontFamily: Typography.headlineBold, fontSize: 14 },
  txCredit: { color: '#4CAF50' },
  txDebit: { color: Colors.onSurface },
  txStatus: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  txDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16 },
});
