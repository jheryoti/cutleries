import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Radius } from '@/constants/theme';
import { auth } from '@/config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import Toast from '@/components/Toast';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '781657944938-per6v6b58vp39muf9tjdkol1k56gce60.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '509013348934-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';

type Tab = 'login' | 'signup';
type ToastState = { visible: boolean; title: string; message?: string; type: 'success' | 'error' | 'info' };

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [toast, setToast] = useState<ToastState>({ visible: false, title: '', type: 'info' });

  const showToast = (title: string, message?: string, type: ToastState['type'] = 'info') => {
    setToast({ visible: true, title, message, type });
  };

  const [request, response, promptAsync] = Google.useAuthRequest(
    Platform.OS === 'web'
      ? { webClientId: WEB_CLIENT_ID }
      : { androidClientId: ANDROID_CLIENT_ID, redirectUri: makeRedirectUri({ scheme: 'cutleries', native: 'cutleries://' }) }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken, accessToken } = response.authentication ?? {};
      handleNativeGoogleResponse(idToken, accessToken);
    }
  }, [response]);

  const finishGoogleSignIn = async (user: any) => {
    try {
      await api.register({ fullName: user.displayName || user.email?.split('@')[0] || 'User', phone: '' });
    } catch {}
    router.replace('/(tabs)');
  };

  const handleNativeGoogleResponse = async (idToken?: string | null, accessToken?: string | null) => {
    if (!idToken && !accessToken) return showToast('Sign-In Failed', 'No token received', 'error');
    setGoogleLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
      const result = await signInWithCredential(auth, credential);
      await finishGoogleSignIn(result.user);
    } catch (e: any) {
      showToast('Google Sign-In Failed', e.message, 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      setGoogleLoading(true);
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await finishGoogleSignIn(result.user);
      } catch (e: any) {
        showToast('Google Sign-In Failed', e.message, 'error');
      } finally {
        setGoogleLoading(false);
      }
    } else {
      promptAsync();
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return showToast('Missing Fields', 'Please fill in all fields', 'error');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e.code === 'auth/invalid-credential' ? 'Invalid email or password' : e.message;
      showToast('Login Failed', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password || !fullName.trim()) return showToast('Missing Fields', 'Please fill in all fields', 'error');
    if (password.length < 6) return showToast('Weak Password', 'Password must be at least 6 characters', 'error');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(cred.user);
      const params = new URLSearchParams({ type: 'email', email: email.trim(), fullName: fullName.trim() });
      router.push(`/otp?${params.toString()}`);
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-in-use' ? 'This email is already registered' : e.message;
      showToast('Sign Up Failed', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) return showToast('Enter Email', 'Enter your email address first', 'info');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('Email Sent', 'Check your inbox for a reset link', 'success');
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom + 40, 60) }, width >= 600 && styles.scrollWide]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <Text style={styles.brandIcon}>🍽️</Text>
          <Text style={styles.brandName}>CUTLERIES.</Text>
        </View>

        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{tab === 'login' ? 'Welcome back' : 'Create account'}</Text>
          <Text style={styles.heroSub}>{tab === 'login' ? 'Sign in to continue ordering' : 'Join the culinary community'}</Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]} onPress={() => setTab('login')}>
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]} onPress={() => setTab('signup')}>
            <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Google button */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          activeOpacity={0.85}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color={Colors.onSurface} size="small" />
          ) : (
            <>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleBtnText}>
                {tab === 'login' ? 'Continue with Google' : 'Sign up with Google'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {tab === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.onSurfaceVariant} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              {tab === 'login' && (
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.onSurfaceVariant} />
              <TextInput
                style={styles.input}
                placeholder={tab === 'signup' ? 'Min. 6 characters' : 'Your password'}
                placeholderTextColor={Colors.onSurfaceVariant}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={tab === 'login' ? handleLogin : handleSignup}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.submitBtnText}>{tab === 'login' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: 24, gap: 20 },
  scrollWide: { width: '100%', maxWidth: 520, alignSelf: 'center' },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { fontSize: 26 },
  brandName: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 22, color: Colors.primary, fontStyle: 'italic', letterSpacing: -1 },

  heroText: { gap: 4 },
  heroTitle: { fontFamily: Typography.headline, fontSize: 28, color: Colors.onSurface, letterSpacing: -0.5 },
  heroSub: { fontFamily: Typography.body, fontSize: 14, color: Colors.onSurfaceVariant },

  tabBar: { flexDirection: 'row', backgroundColor: Colors.surfaceContainerHigh, borderRadius: 14, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.onPrimary, fontFamily: Typography.headlineBold },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16, paddingVertical: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  googleG: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontFamily: Typography.headlineBold, fontSize: 15, color: Colors.onSurface },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant },

  form: { gap: 14 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontFamily: Typography.label, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 2, marginLeft: 2 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotText: { fontFamily: Typography.bodyMedium, fontSize: 12, color: Colors.primary },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  input: { flex: 1, color: Colors.onSurface, fontFamily: Typography.body, fontSize: 15 },

  submitBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: Typography.headlineBold, fontSize: 16, color: Colors.onPrimary },

  terms: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.primary },
});
