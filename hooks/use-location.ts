import { useContext, createContext } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_DATE_KEY = '@location_last_prompted';
const LOCATION_COORDS_KEY = '@location_coords';

export type LocationCoords = { latitude: number; longitude: number } | null;

export async function shouldShowLocationPrompt(): Promise<boolean> {
  const lastPrompted = await AsyncStorage.getItem(LOCATION_DATE_KEY);
  const today = new Date().toDateString();
  return lastPrompted !== today;
}

export async function markLocationPromptShown() {
  await AsyncStorage.setItem(LOCATION_DATE_KEY, new Date().toDateString());
}

export async function getCachedLocation(): Promise<LocationCoords> {
  const raw = await AsyncStorage.getItem(LOCATION_COORDS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function requestAndSaveLocation(): Promise<LocationCoords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    await markLocationPromptShown(); // don't ask again today even if denied
    return null;
  }
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  await AsyncStorage.setItem(LOCATION_COORDS_KEY, JSON.stringify(coords));
  await markLocationPromptShown();
  return coords;
}

// ─── Context shared across the app ────────────────────────────────────────────
type LocationContextType = {
  location: LocationCoords;
  setLocation: (c: LocationCoords) => void;
};

export const LocationContext = createContext<LocationContextType>({
  location: null,
  setLocation: () => {},
});

export const useLocationContext = () => useContext(LocationContext);
