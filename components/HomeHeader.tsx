import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { useProfileImage } from '@/context/ProfileImageContext';
import { useApp } from '@/context/AppContext';

type LocationState =
  | { status: 'gps' }
  | { status: 'geocoding' }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'ready'; address: string };

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (results.length > 0) {
      const r = results[0];
      const city = r.city || r.subregion || r.region || '';
      const street = r.street || r.district || r.name || '';
      const number = r.streetNumber ? ` ${r.streetNumber}` : '';
      if (city && street) return `${city}, ${street}${number}`;
      if (city) return city;
      if (street) return `${street}${number}`;
      if (r.region) return r.region;
    }
  } catch {}
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

function PulsingDot() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.pulsingDot, { opacity: anim }]} />;
}

type Props = {
  headerBg: Animated.AnimatedInterpolation<string>;
  paddingTop: number;
};

export default function HomeHeader({ headerBg, paddingTop }: Props) {
  const { profileImage, setProfileImage } = useProfileImage();
  const { unreadCount } = useApp();
  const [locationState, setLocationState] = useState<LocationState>({ status: 'gps' });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationState({ status: 'denied' }); return; }
      setLocationState({ status: 'gps' });
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocationState({ status: 'geocoding' });
        const address = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        setLocationState({ status: 'ready', address });
      } catch {
        setLocationState({ status: 'error' });
      }
    })();
  }, []);

  const pickImage = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (!result.canceled) await setProfileImage(result.assets[0].uri);
    } else {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Gallery access is needed.'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (!result.canceled) await setProfileImage(result.assets[0].uri);
    }
  };

  const handleProfilePress = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: '📷  Camera', onPress: () => pickImage('camera') },
      { text: '🖼️  Gallery', onPress: () => pickImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const isLoading = locationState.status === 'gps' || locationState.status === 'geocoding';

  const locationLabel = () => {
    switch (locationState.status) {
      case 'gps':       return 'Detecting location...';
      case 'geocoding': return 'Fetching address...';
      case 'denied':    return 'Enable location';
      case 'error':     return 'Unknown location';
      case 'ready':     return locationState.address;
    }
  };

  const locationColor = (locationState.status === 'denied' || locationState.status === 'error')
    ? Colors.error : Colors.onSurface;

  return (
    <Animated.View style={[styles.header, { paddingTop, backgroundColor: headerBg }]}>
      {/* Left: location */}
      <TouchableOpacity style={styles.locationBtn} activeOpacity={0.7}>
        <View style={[styles.pinWrap, (locationState.status === 'denied' || locationState.status === 'error') && styles.pinWrapError]}>
          <Ionicons
            name={locationState.status === 'denied' ? 'location-outline' : 'location'}
            size={15}
            color={locationState.status === 'denied' || locationState.status === 'error' ? Colors.error : Colors.primary}
          />
        </View>
        <View style={styles.locationTextWrap}>
          <Text style={styles.deliverTo}>DELIVER TO</Text>
          <View style={styles.addressRow}>
            {isLoading && <PulsingDot />}
            <Text style={[styles.address, { color: locationColor }]} numberOfLines={1}>{locationLabel()}</Text>
            {!isLoading && locationState.status === 'ready' && (
              <Ionicons name="chevron-down" size={11} color={Colors.primary} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Right: bell + avatar */}
      <View style={styles.rightRow}>
        <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications')} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={20} color={Colors.onSurface} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatarBtn} onPress={handleProfilePress} activeOpacity={0.85}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={Colors.onSurfaceVariant} />
            </View>
          )}
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14,
  },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 },
  pinWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: `${Colors.primary}18`, alignItems: 'center', justifyContent: 'center' },
  pinWrapError: { backgroundColor: `${Colors.error}15` },
  locationTextWrap: { flex: 1, gap: 1 },
  deliverTo: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 1.5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  address: { fontFamily: Typography.headlineBold, fontSize: 14, flex: 1 },
  pulsingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: { position: 'relative', width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.surface },
  bellBadgeText: { fontFamily: Typography.headlineBold, fontSize: 8, color: '#fff' },
  avatarBtn: { position: 'relative' },
  avatarImg: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: `${Colors.primary}50` },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surfaceContainerHigh, borderWidth: 2, borderColor: `${Colors.primary}30`, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.surface },
});
