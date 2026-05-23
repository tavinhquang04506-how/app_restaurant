import type { LoginUser } from '../types/types';

const ACCESS_TOKEN_KEY = 'restaurant_access_token';
const REFRESH_TOKEN_KEY = 'restaurant_refresh_token';
const USER_KEY = 'restaurant_auth_user';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

const getLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
};

const getItem = <T = string>(key: string): T | null => {
  const storage = getLocalStorage();
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
};

const setItem = (key: string, value: unknown) => {
  const storage = getLocalStorage();
  if (!storage) return;
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  storage.setItem(key, payload);
};

export const authStorage = {
  getTokens(): StoredTokens | null {
    const accessToken = getItem<string>(ACCESS_TOKEN_KEY);
    const refreshToken = getItem<string>(REFRESH_TOKEN_KEY);
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  },
  setTokens(tokens: StoredTokens) {
    setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  getUser(): LoginUser | null {
    return getItem<LoginUser>(USER_KEY);
  },
  setUser(user: LoginUser) {
    setItem(USER_KEY, user);
  },
  clear() {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  },
};

