import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBtPFEokyRda7n1SBYpEcWKcj1Jul_RMa8',
  authDomain: 'cutleries.firebaseapp.com',
  projectId: 'cutleries',
  storageBucket: 'cutleries.firebasestorage.app',
  messagingSenderId: '509013348934',
  appId: '1:509013348934:android:ca5c9ac16778565a14b047',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);
export const storage = getStorage(app);
