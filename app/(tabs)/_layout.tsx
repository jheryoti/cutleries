import { Tabs } from 'expo-router';
import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type TabButtonProps = {
  focused: boolean;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameFocused: keyof typeof Ionicons.glyphMap;
};

function TabIcon({ focused, label, iconName, iconNameFocused }: TabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 60, bounciness: 4 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
      ]).start();
    }
  }, [focused]);

  const color = focused ? Colors.primary : '#5A6070';

  return (
    <Animated.View style={[styles.tabBtn, { transform: [{ scale }] }]}>
      {focused && <View style={styles.activeBar} />}
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons name={focused ? iconNameFocused : iconName} size={22} color={color} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, {
          height: Math.max(64, insets.bottom + 60),
          paddingBottom: Math.max(8, insets.bottom),
        }],
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#5A6070',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Home" iconName="home-outline" iconNameFocused="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Explore" iconName="search-outline" iconNameFocused="search" />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Wallet" iconName="wallet-outline" iconNameFocused="wallet" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Profile" iconName="person-outline" iconNameFocused="person" />
          ),
        }}
      />
      <Tabs.Screen name="orders" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F1117',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 0,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  iconWrap: {
    width: 46,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: `${Colors.primary}1A`,
  },
  tabLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: '#5A6070',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.headlineBold,
  },
});
