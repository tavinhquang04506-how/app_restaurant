import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { apiUrl } from '../utils/Utils';

const SESSION_ACCESS_KEY = 'session_access';
const SESSION_REFRESH_KEY = 'session_refresh';

/**
 * HTTP wrapper using Axios.
 * Automatically handles auth tokens, token refresh, timeouts, and standard backend error parsing.
 */

// Create Axios Instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let buffer = '';
    const str = base64.replace(/=+$/, '');
    for (let i = 0, bc = 0, bs = 0; i < str.length; i++) {
      const char = str.charAt(i);
      const idx = chars.indexOf(char);
      if (idx === -1) continue;
      bs = bc % 4 ? bs * 64 + idx : idx;
      if (bc++ % 4) {
        buffer += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
    
    const payload = JSON.parse(buffer);
    if (payload && typeof payload.exp === 'number') {
      const expiry = payload.exp * 1000;
      // Consider expired 10 seconds before actual expiry
      return Date.now() >= (expiry - 10000);
    }
    return false;
  } catch (e) {
    return true;
  }
}

// Mutex to prevent multiple concurrent refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem(SESSION_REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    // Call the refresh endpoint directly with axios (not apiClient) to avoid interceptor loops
    const baseURL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    const data = response.data?.data ?? response.data;
    const newAccessToken = data?.accessToken;

    if (newAccessToken) {
      await AsyncStorage.setItem(SESSION_ACCESS_KEY, newAccessToken);
      return newAccessToken;
    }
    return null;
  } catch (err) {
    console.warn('Token refresh failed:', err);
    // Refresh failed — clear all session data
    await AsyncStorage.multiRemove([SESSION_ACCESS_KEY, SESSION_REFRESH_KEY, 'session_user']).catch(() => {});
    return null;
  }
}

// Request Interceptor: Attach Token (with auto-refresh)
apiClient.interceptors.request.use(
  async (config) => {
    let token = await AsyncStorage.getItem(SESSION_ACCESS_KEY);

    if (token && isTokenExpired(token)) {
      // Token is expired or about to expire — try to refresh
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefreshToken();
        isRefreshing = false;

        if (newToken) {
          token = newToken;
          onTokenRefreshed(newToken);
        } else {
          // Refresh failed, clear everything
          token = null;
          refreshSubscribers = [];
        }
      } else {
        // Another request is already refreshing — wait for it
        token = await new Promise<string>((resolve) => {
          addRefreshSubscriber((newToken: string) => resolve(newToken));
        });
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

function extractMessage(payload: any): string {
  if (!payload) return '';
  const stringify = (value: any): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.filter(Boolean).join(' ; ');
    if (value && typeof value === 'object') return Object.values(value).filter(Boolean).join(' ; ');
    return value?.toString() ?? '';
  };
  const msg = stringify(payload.message);
  if (msg && msg !== 'null') return msg;
  const err = stringify(payload.error);
  if (err && err !== 'null') return err;
  return '';
}

// Response Interceptor: Error Handling (with 401 retry after refresh)
apiClient.interceptors.response.use(
  (response) => {
    // Backend success format { statusCode, message, data }
    return response.data ?? { statusCode: response.status, message: '', data: null };
  },
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Kết nối hết thời gian chờ, vui lòng thử lại.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối tới máy chủ, vui lòng kiểm tra mạng.'));
    }

    const originalRequest = error.config;
    const { status, data } = error.response;
    const msg = extractMessage(data);

    // If 401 and we haven't retried yet, try refreshing the token once
    if (status === 401 && !originalRequest._hasRetried) {
      originalRequest._hasRetried = true;

      const newToken = await tryRefreshToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }
    
    if (status === 401) {
      return Promise.reject(new Error(msg || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'));
    }

    return Promise.reject(new Error(msg || `Yêu cầu thất bại (HTTP ${status}).`));
  }
);

// ===== Public API =====

export async function getJson(
  path: string,
  options?: { query?: Record<string, any>; headers?: Record<string, string> },
): Promise<any> {
  const p = path.startsWith('/') ? path : `/${path}`;
  return apiClient.get(p, { params: options?.query, headers: options?.headers });
}

export async function postJson(
  path: string,
  options?: { body?: any; query?: Record<string, any>; headers?: Record<string, string> },
): Promise<any> {
  const p = path.startsWith('/') ? path : `/${path}`;
  return apiClient.post(p, options?.body, { params: options?.query, headers: options?.headers });
}

export async function putJson(
  path: string,
  options?: { body?: any; query?: Record<string, any>; headers?: Record<string, string> },
): Promise<any> {
  const p = path.startsWith('/') ? path : `/${path}`;
  return apiClient.put(p, options?.body, { params: options?.query, headers: options?.headers });
}

export async function deleteJson(
  path: string,
  options?: { body?: any; query?: Record<string, any>; headers?: Record<string, string> },
): Promise<any> {
  const p = path.startsWith('/') ? path : `/${path}`;
  return apiClient.delete(p, { data: options?.body, params: options?.query, headers: options?.headers });
}
