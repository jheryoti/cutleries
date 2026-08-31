import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_800ExtraBold_Italic,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Colors } from '@/constants/theme';
import { LocationContext, LocationCoords, getCachedLocation } from '@/hooks/use-location';
import { ProfileImageProvider } from '@/context/ProfileImageContext';
import { AppProvider } from '@/context/AppContext';

LogBox.ignoreLogs(['Unable to activate keep awake', 'Keep awake', 'shadow*']);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    PlusJakartaSans_800ExtraBold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [location, setLocation] = useState<LocationCoords>(null);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      getCachedLocation().then(setLocation);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: Colors.surface }} />;

  return (
    <AppProvider>
      <ProfileImageProvider>
        <LocationContext.Provider value={{ location, setLocation }}>
          <SafeAreaProvider>
            <StatusBar style="light" backgroundColor="transparent" translucent />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="location-permission" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="otp" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="vendor/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="cart" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="tracking" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="send-money" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </SafeAreaProvider>
        </LocationContext.Provider>
      </ProfileImageProvider>
    </AppProvider>
  );
}
