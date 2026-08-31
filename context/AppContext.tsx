import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// ── Types ────────────────────────────────────────────────────────────────────
export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageURL?: string;
  vendorId: string;
  vendorName: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'promo' | 'system';
  read: boolean;
  createdAt: number;
};

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  fullName?: string;
  memberTier?: string;
  totalOrders?: number;
  rating?: number;
};

type AppContextType = {
  // Auth
  user: AppUser | null;
  authLoading: boolean;
  // Cart
  cartItems: CartItem[];
  cartVendorId: string | null;
  cartVendorName: string | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQty: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAllRead: () => void;
  // Wallet
  walletBalance: number;
  setWalletBalance: (b: number) => void;
};

const AppContext = createContext<AppContextType>({} as AppContextType);

const CART_KEY = '@cart_items';
const NOTIF_KEY = '@notifications';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartVendorId, setCartVendorId] = useState<string | null>(null);
  const [cartVendorName, setCartVendorName] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Persist cart
  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((raw) => {
      if (raw) {
        const parsed = JSON.parse(raw);
        setCartItems(parsed.items || []);
        setCartVendorId(parsed.vendorId || null);
        setCartVendorName(parsed.vendorName || null);
      }
    });
    AsyncStorage.getItem(NOTIF_KEY).then((raw) => {
      if (raw) setNotifications(JSON.parse(raw));
    });
  }, []);

  const persistCart = useCallback((items: CartItem[], vendorId: string | null, vendorName: string | null) => {
    AsyncStorage.setItem(CART_KEY, JSON.stringify({ items, vendorId, vendorName }));
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems((prev) => {
      let next: CartItem[];
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        next = prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        next = [...prev, { ...item, qty: 1 }];
      }
      persistCart(next, item.vendorId, item.vendorName);
      return next;
    });
    setCartVendorId(item.vendorId);
    setCartVendorName(item.vendorName);
  }, [persistCart]);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      persistCart(next, cartVendorId, cartVendorName);
      return next;
    });
  }, [cartVendorId, cartVendorName, persistCart]);

  const updateQty = useCallback((itemId: string, delta: number) => {
    setCartItems((prev) => {
      const next = prev
        .map((i) => i.id === itemId ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0);
      persistCart(next, cartVendorId, cartVendorName);
      return next;
    });
  }, [cartVendorId, cartVendorName, persistCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartVendorId(null);
    setCartVendorName(null);
    AsyncStorage.removeItem(CART_KEY);
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const notif: Notification = {
      ...n,
      id: Date.now().toString(),
      read: false,
      createdAt: Date.now(),
    };
    setNotifications((prev) => {
      const next = [notif, ...prev].slice(0, 50);
      AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{
      user, authLoading,
      cartItems, cartVendorId, cartVendorName,
      addToCart, removeFromCart, updateQty, clearCart,
      cartTotal, cartCount,
      notifications, unreadCount, addNotification, markAllRead,
      walletBalance, setWalletBalance,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
