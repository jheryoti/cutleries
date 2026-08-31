import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Radius } from '@/constants/theme';
import { useProfileImage } from '@/context/ProfileImageContext';
import { auth } from '@/config/firebase';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profileImage, setProfileImage } = useProfileImage();
  const [localImage, setLocalImage] = useState<string | null>(profileImage);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(auth.currentUser?.email ?? '');
  }, []);

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
            return;
          }
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
        if (!result.canceled) setLocalImage(result.assets[0].uri);
      } else {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Gallery access is needed to select a photo.');
            return;
          }
        }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
        if (!result.canceled) setLocalImage(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to pick image.');
    }
  };

  const handleSave = async () => {
    if (!email || email.trim() === '') {
      return Alert.alert('Email required', 'Please provide your email (required).');
    }
    if (!localImage) {
      return Alert.alert('Photo required', 'Please select or take a profile photo.');
    }
    setLoading(true);
    try {
      await setProfileImage(localImage);
      Alert.alert('Saved', 'Profile updated successfully.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}> 
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Profile Photo</Text>
        <Text style={styles.subtitle}>Add a photo and confirm your email (required)</Text>

        <TouchableOpacity style={styles.avatarWrap} onPress={() => pickImage('gallery')} activeOpacity={0.85}>
          {localImage ? (
            <Image source={{ uri: localImage }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}><Text style={styles.avatarPlaceholderText}>Add</Text></View>
          )}
        </TouchableOpacity>

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage('camera')}>
            <Text style={styles.photoBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage('gallery')}>
            <Text style={styles.photoBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.label}>Email (required)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!auth.currentUser?.email}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: 20 },
  back: { marginBottom: 18 },
  backText: { fontFamily: Typography.bodyMedium, fontSize: 15, color: Colors.primary },
  content: { flex: 1, alignItems: 'center', gap: 14 },
  title: { fontFamily: Typography.headlineBold, fontSize: 24, color: Colors.onSurface },
  subtitle: { fontFamily: Typography.body, fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },

  avatarWrap: { marginTop: 12, marginBottom: 8 },
  avatarImg: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: Colors.outline },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.outline },
  avatarPlaceholderText: { color: Colors.onSurfaceVariant },

  photoButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoBtn: { backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outline },
  photoBtnText: { color: Colors.onSurface, fontFamily: Typography.bodyMedium },

  formRow: { width: '100%', marginTop: 6 },
  label: { fontFamily: Typography.label, color: Colors.onSurfaceVariant, marginBottom: 6 },
  input: { backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.outline, color: Colors.onSurface },

  saveBtn: { marginTop: 18, width: '100%', backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.xxl, alignItems: 'center' },
  saveBtnText: { color: Colors.onPrimary, fontFamily: Typography.headline, fontSize: 16 },
});
