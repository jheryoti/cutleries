import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
};

const CONFIG: Record<ToastType, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', icon: 'checkmark-circle' },
  error:   { color: Colors.error, bg: `${Colors.error}15`, icon: 'close-circle' },
  info:    { color: Colors.primary, bg: `${Colors.primary}15`, icon: 'information-circle' },
  warning: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)', icon: 'warning' },
};

export default function Toast({ visible, title, message, type = 'success', onHide, duration = 3000 }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => hide(), duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const cfg = CONFIG[type];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity, backgroundColor: cfg.bg, borderColor: cfg.color }]}>
      <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: cfg.color }]}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeBtn}>
        <Ionicons name="close" size={16} color={cfg.color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 999,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14,
    borderWidth: 1,
  },
  textWrap: { flex: 1 },
  title: { fontFamily: Typography.headlineBold, fontSize: 14 },
  message: { fontFamily: Typography.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  closeBtn: { padding: 2 },
});
