import { Platform } from 'react-native';

// Sử dụng IP LAN của máy tính để app trên điện thoại thật có thể gọi được API
// Kết nối qua dây cáp USB (adb reverse)
const DEFAULT_HOST = '127.0.0.1';

export const API_BASE_URL = `http://${DEFAULT_HOST}:8080`;
export const API_PREFIX = '/api/v1';

export function buildApiBasePath(): string {
  const base = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  if (!API_PREFIX) return base;
  const prefix = API_PREFIX.startsWith('/') ? API_PREFIX : `/${API_PREFIX}`;
  return `${base}${prefix}`;
}

export function buildWsEndpoint(): string {
  const base = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  return `${base}${API_PREFIX}/ws-chat`;
}
