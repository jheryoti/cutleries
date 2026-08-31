import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Radius } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { api } from '@/services/api';

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { type, phone, fullName, email, sessionInfo } = useLocalSearchParams<{
    type: 'phone' | 'email';
    phone?: string;
    fullName?: string;
    email?: string;
    sessionInfo?: string;
  }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (resendTimer === 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (val: string, idx: number) => {
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const code = otp.join('');
  const otpBoxWidth = Math.min(48, Math.max(38, (width - 48 - 50) / 6));

  const handleVerifyPhone = async () => {
    if (code.length < 6) return Alert.alert('Error', 'Enter the 6-digit code');
    if (!sessionInfo) return Alert.alert('Error', 'Session expired. Go back and try again.');
    setLoading(true);
    try {
      const result = await api.verifyPhoneOtp(sessionInfo, code);
      if (result.error) return Alert.alert('Invalid Code', result.error);
      // Sign into Firebase with the custom token from backend
      const { signInWithCustomToken } = await import('firebase/auth');
      await signInWithCustomToken(auth, result.customToken);
      await api.register({ fullName: fullName || '', phone: phone || '' });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      await user.reload();
      if (!user.emailVerified) {
        return Alert.alert('Not verified yet', 'Please check your email and click the verification link first, then tap Continue.');
      }
      await api.register({ fullName: fullName || '', phone: '' });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    const user = auth.currentUser;
    if (type === 'email' && user) {
      await sendEmailVerification(user);
      Alert.alert('Sent', 'Verification email resent. Check your inbox.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>{type === 'phone' ? '📱' : '📧'}</Text>
        <Text style={styles.title}>Verify your {type === 'phone' ? 'phone' : 'email'}</Text>
        <Text style={styles.subtitle}>
          {type === 'phone'
            ? `We sent a 6-digit code to ${phone}`
            : `We sent a verification link to ${email}.\nClick it then tap Continue below.`}
        </Text>

        {type === 'phone' && (
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(r) => { if (r) inputs.current[idx] = r; }}
                style={[styles.otpBox, { width: otpBoxWidth }, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(v) => handleChange(v.slice(-1), idx)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={type === 'phone' ? handleVerifyPhone : handleVerifyEmail}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Verifying...' : type === 'phone' ? 'Verify Code' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
          <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: 24 },
  back: { marginBottom: 32 },
  backText: { fontFamily: Typography.bodyMedium, fontSize: 15, color: Colors.primary },
  content: { flex: 1, alignItems: 'center', gap: 20 },
  emoji: { fontSize: 48 },
  title: { fontFamily: Typography.headlineBold, fontSize: 26, color: Colors.onSurface, letterSpacing: -0.5 },
  subtitle: { fontFamily: Typography.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  otpRow: { flexDirection: 'row', gap: 10, marginTop: 8, justifyContent: 'center' },
  otpBox: {
    height: 56, borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    textAlign: 'center', fontSize: 22,
    fontFamily: Typography.headlineBold, color: Colors.onSurface,
    borderWidth: 1, borderColor: 'transparent',
  },
  otpBoxFilled: { borderColor: Colors.primary },
  submitBtn: {
    width: '100%', backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xxl, paddingVertical: 18,
    alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { fontFamily: Typography.headline, fontSize: 17, color: Colors.onPrimaryContainer },
  resend: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.primary, marginTop: 8 },
  resendDisabled: { color: Colors.onSurfaceVariant },
});
