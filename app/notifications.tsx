import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const TYPE_CONFIG = {
  order:   { icon: 'receipt-outline' as const,       color: Colors.primary },
  payment: { icon: 'card-outline' as const,           color: '#4CAF50' },
  promo:   { icon: 'gift-outline' as const,           color: '#FF9800' },
  system:  { icon: 'information-circle-outline' as const, color: Colors.onSurfaceVariant },
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markAllRead } = useApp();

  useEffect(() => {
    return () => { markAllRead(); };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.outline} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>You&apos;ll see order updates and promotions here</Text>
          </View>
        ) : (
          notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
            return (
              <View key={n.id} style={[styles.notifCard, !n.read && styles.notifCardUnread]}>
                <View style={[styles.notifIcon, { backgroundColor: `${cfg.color}18` }]}>
                  <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTop}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    {!n.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifMessage}>{n.message}</Text>
                  <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: Typography.headlineBold, fontSize: 20, color: Colors.onSurface },
  markRead: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontFamily: Typography.headlineBold, fontSize: 18, color: Colors.onSurface },
  emptyText: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },
  notifCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  notifCardUnread: { borderColor: `${Colors.primary}25`, backgroundColor: `${Colors.primary}08` },
  notifIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, gap: 3 },
  notifTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTitle: { flex: 1, fontFamily: Typography.headlineBold, fontSize: 14, color: Colors.onSurface },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMessage: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 18 },
  notifTime: { fontFamily: Typography.label, fontSize: 11, color: Colors.outline, marginTop: 2 },
});
