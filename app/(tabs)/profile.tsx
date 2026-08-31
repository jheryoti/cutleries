import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import { api } from '@/services/api';
import { useProfileImage } from '@/context/ProfileImageContext';
import Skeleton from '@/components/Skeleton';

const SETTINGS = [
  {
    group: 'Account',
    items: [
      { icon: 'person-outline' as const, title: 'Personal Information', sub: 'Name, email, phone number' },
      { icon: 'key-outline' as const, title: 'Change Password', sub: 'Update your login credentials' },
      { icon: 'location-outline' as const, title: 'Saved Addresses', sub: 'Home, work and other places' },
    ],
  },
  {
    group: 'Payments',
    items: [
      { icon: 'card-outline' as const, title: 'Payment Methods', sub: 'Cards and bank accounts' },
      { icon: 'gift-outline' as const, title: 'Promo Codes', sub: 'Redeem discount vouchers' },
    ],
  },
  {
    group: 'Preferences',
    items: [
      { icon: 'notifications-outline' as const, title: 'Notifications', sub: 'Push, email and SMS alerts' },
      { icon: 'moon-outline' as const, title: 'Appearance', sub: 'Dark mode, language' },
    ],
  },
  {
    group: 'Support',
    items: [
      { icon: 'chatbubble-outline' as const, title: 'Help & Support', sub: '24/7 customer service' },
      { icon: 'star-outline' as const, title: 'Rate the App', sub: 'Share your feedback' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profileImage, setProfileImage } = useProfileImage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    api.getMe().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          router.replace('/auth');
        },
      },
    ]);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    setShowPhotoModal(false);
    setImageUploading(true);
    try {
      if (source === 'camera') {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
            return;
          }
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true, aspect: [1, 1], quality: 0.85,
        });
        if (!result.canceled) await setProfileImage(result.assets[0].uri);
      } else {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Gallery access is needed to select a photo.');
            return;
          }
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true, aspect: [1, 1], quality: 0.85,
        });
        if (!result.canceled) await setProfileImage(result.assets[0].uri);
      }
    } finally {
      setImageUploading(false);
    }
  };

  const removePhoto = async () => {
    setShowPhotoModal(false);
    await setProfileImage(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => setShowPhotoModal(true)}
            activeOpacity={0.85}
            disabled={imageUploading}
          >
            {imageUploading ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.onSurfaceVariant} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
            <View style={styles.onlineDot} />
          </TouchableOpacity>

          <Text style={styles.uploadHint}>Tap to change photo</Text>

          {/* User info */}
          {loading ? (
            <View style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Skeleton width={140} height={20} borderRadius={6} />
              <Skeleton width={180} height={14} borderRadius={4} />
              <View style={styles.statsRowSkeleton}>
                <Skeleton width={60} height={40} borderRadius={10} />
                <Skeleton width={60} height={40} borderRadius={10} />
                <Skeleton width={60} height={40} borderRadius={10} />
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.totalOrders ?? 0}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.rating ?? '—'}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(user?.memberTier || 'Standard').charAt(0).toUpperCase() +
                      (user?.memberTier || 'Standard').slice(1)}
                  </Text>
                  <Text style={styles.statLabel}>Tier</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Settings */}
        {SETTINGS.map((group) => (
          <View key={group.group} style={styles.settingsGroup}>
            <Text style={styles.groupLabel}>{group.group}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => (
                <View key={item.title}>
                  <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                    <View style={styles.settingIconWrap}>
                      <Ionicons name={item.icon} size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSub}>{item.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.outline} />
                  </TouchableOpacity>
                  {index < group.items.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Cutleries v1.0.0 · Made with ❤️ in Lagos</Text>
      </ScrollView>

      {/* Photo picker modal */}
      <Modal visible={showPhotoModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoModal(false)}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Profile Photo</Text>

            <TouchableOpacity style={styles.modalOption} onPress={() => pickImage('camera')} activeOpacity={0.75}>
              <View style={[styles.modalOptionIcon, { backgroundColor: `${Colors.primary}18` }]}>
                <Ionicons name="camera" size={22} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Take Photo</Text>
                <Text style={styles.modalOptionSub}>Use your camera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => pickImage('gallery')} activeOpacity={0.75}>
              <View style={[styles.modalOptionIcon, { backgroundColor: `${Colors.primary}18` }]}>
                <Ionicons name="images" size={22} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionSub}>Select an existing photo</Text>
              </View>
            </TouchableOpacity>

            {profileImage && (
              <TouchableOpacity style={styles.modalOption} onPress={removePhoto} activeOpacity={0.75}>
                <View style={[styles.modalOptionIcon, { backgroundColor: `${Colors.error}15` }]}>
                  <Ionicons name="trash-outline" size={22} color={Colors.error} />
                </View>
                <View>
                  <Text style={[styles.modalOptionTitle, { color: Colors.error }]}>Remove Photo</Text>
                  <Text style={styles.modalOptionSub}>Revert to default icon</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPhotoModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: 20, gap: 20 },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontFamily: Typography.headline, fontSize: 28, color: Colors.onSurface, letterSpacing: -0.5 },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },

  profileCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: `${Colors.primary}40`,
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 3, borderColor: `${Colors.primary}25`,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLoading: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surfaceContainerLow,
  },
  onlineDot: {
    position: 'absolute', top: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2, borderColor: Colors.surfaceContainerLow,
  },
  uploadHint: {
    fontFamily: Typography.label, fontSize: 11,
    color: Colors.onSurfaceVariant, marginTop: -4,
  },
  profileInfo: { alignItems: 'center', gap: 4, width: '100%' },
  profileName: { fontFamily: Typography.headline, fontSize: 22, color: Colors.onSurface, letterSpacing: -0.3 },
  profileEmail: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16, padding: 16, marginTop: 8, width: '100%',
  },
  statsRowSkeleton: {
    flexDirection: 'row', gap: 12, marginTop: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontFamily: Typography.headlineBold, fontSize: 17, color: Colors.onSurface },
  statLabel: { fontFamily: Typography.label, fontSize: 11, color: Colors.onSurfaceVariant },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },

  settingsGroup: { gap: 10 },
  groupLabel: { fontFamily: Typography.label, fontSize: 11, color: Colors.outline, letterSpacing: 1, marginLeft: 4 },
  groupCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  settingIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontFamily: Typography.bodyMedium, fontSize: 15, color: Colors.onSurface },
  settingSub: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 70 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 18, paddingVertical: 16,
    borderWidth: 1, borderColor: `${Colors.error}20`,
  },
  logoutText: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.error },
  version: { fontFamily: Typography.body, fontSize: 12, color: Colors.outline, textAlign: 'center', paddingBottom: 8 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, gap: 4,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.outline,
    alignSelf: 'center', marginBottom: 12,
  },
  modalTitle: {
    fontFamily: Typography.headlineBold, fontSize: 18,
    color: Colors.onSurface, marginBottom: 8, marginLeft: 4,
  },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  modalOptionIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modalOptionTitle: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
  modalOptionSub: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  modalCancelBtn: {
    marginTop: 8, paddingVertical: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16, alignItems: 'center',
  },
  modalCancelText: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },
});
