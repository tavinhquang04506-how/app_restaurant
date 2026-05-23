import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { authStorage } from '../services/authStorage';
import { restaurantApi } from '../services/restaurantApi';
import type { LoginUser } from '../types/types';

interface AuthContextValue {
  user: LoginUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginUser | null>(() => authStorage.getUser());
  const [tokens, setTokens] = useState(authStorage.getTokens());
  const isAuthenticated = Boolean(tokens?.accessToken);

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    const data = await restaurantApi.login(credentials);
    if (data.user && data.user.role === 'USER') {
      throw new Error('Tài khoản Khách hàng không có quyền truy cập trang quản trị này. Vui lòng tải ứng dụng di động để trải nghiệm dịch vụ.');
    }
    authStorage.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    authStorage.setUser(data.user);
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    if (tokens?.refreshToken) {
      try {
        await restaurantApi.logout(tokens.refreshToken);
      } catch {
        // ignore logout errors so user can still clear session
      }
    }
    authStorage.clear();
    setTokens(null);
    setUser(null);
  }, [tokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken: tokens?.accessToken ?? null,
      refreshToken: tokens?.refreshToken ?? null,
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout, tokens, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

