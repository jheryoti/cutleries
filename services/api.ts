import { auth } from '@/config/firebase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getDevelopmentApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.replace(/^\w+:\/\//, '').split(':')[0];

  return host ? `http://${host}:3000` : 'http://localhost:3000';
}

// Set EXPO_PUBLIC_API_URL for a production backend. During Expo Go development,
// use the same LAN address as Metro so a physical phone can reach the local API.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web'
  ? 'http://localhost:3000'
  : getDevelopmentApiUrl())).replace(/\/$/, '');

async function getHeaders(requireAuth = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {}
  }
  return headers;
}

async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${url}`, options);
  } catch {
    throw new Error('Cannot reach the Cutleries server. Start the backend and make sure your phone and computer use the same Wi-Fi network.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ── Vendors ──────────────────────────────────────────────────────────────
  getVendors: (categoryId?: string) => {
    const q = categoryId ? `?categoryId=${categoryId}` : '';
    return request(`/vendors${q}`);
  },
  getVendor: (id: string) => request(`/vendors/${id}`),
  getVendorMenu: (id: string) => request(`/vendors/${id}/menu`),
  getCategories: () => request('/vendors/categories/all'),

  // ── Auth ─────────────────────────────────────────────────────────────────
  getMe: async () => {
    const h = await getHeaders(true);
    return request('/auth/me', { headers: h });
  },
  register: async (body: { fullName: string; phone: string }) => {
    const h = await getHeaders(true);
    return request('/auth/register', { method: 'POST', headers: h, body: JSON.stringify(body) });
  },
  verifyPhoneOtp: (sessionInfo: string, code: string) =>
    request('/auth/verify-phone-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionInfo, code }) }),

  // ── Orders ───────────────────────────────────────────────────────────────
  getMyOrders: async () => {
    const h = await getHeaders(true);
    return request('/orders/user', { headers: h });
  },
  getOrder: async (id: string) => {
    const h = await getHeaders(true);
    return request(`/orders/${id}`, { headers: h });
  },
  createOrder: async (body: object) => {
    const h = await getHeaders(true);
    return request('/orders', { method: 'POST', headers: h, body: JSON.stringify(body) });
  },

  // ── Wallet ───────────────────────────────────────────────────────────────
  getWalletBalance: async () => {
    const h = await getHeaders(true);
    return request('/wallet/balance', { headers: h });
  },
  getTransactions: async () => {
    const h = await getHeaders(true);
    return request('/wallet/transactions', { headers: h });
  },
  topUpWallet: async (amount: number, method: 'bank' | 'card') => {
    const h = await getHeaders(true);
    return request('/wallet/topup', { method: 'POST', headers: h, body: JSON.stringify({ amount, method }) });
  },
  sendMoney: async (recipientUsername: string, amount: number) => {
    const h = await getHeaders(true);
    return request('/wallet/send', { method: 'POST', headers: h, body: JSON.stringify({ recipientUsername, amount }) });
  },
};
