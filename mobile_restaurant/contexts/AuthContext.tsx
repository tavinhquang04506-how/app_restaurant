import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionUserModel } from '../models/AuthModels';

// ==================== User (mapped from Flutter User class) ====================
export interface User {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  avatarUrl?: string;
  role?: string;
}

function mapGender(gender?: string): string | undefined {
  if (!gender) return undefined;
  switch (gender.toUpperCase()) {
    case 'MALE': return 'Nam';
    case 'FEMALE': return 'Nữ';
    default: return undefined;
  }
}

export function mapGenderToBackend(gender?: string): string | undefined {
  if (!gender) return undefined;
  if (gender === 'Nam') return 'MALE';
  if (gender === 'Nữ') return 'FEMALE';
  return undefined;
}

export function userFromSessionModel(model: SessionUserModel): User {
  return {
    id: model.id,
    name: model.username,
    email: model.email,
    phone: model.phone,
    avatarUrl: model.avatar,
    gender: mapGender(model.gender),
    role: model.role,
  };
}

// ==================== Booking Session ====================
export interface BookingSession {
  branch: string;
  branchId?: string;
  date: string;
  time: string;
  guestCount: number;
  tableId?: string;
  tableCode?: string;
  area?: string;
  tableDescription?: string;
  specialRequest?: string;
  durationMinutes: number;
  holdExpiresAt?: number;
}

// ==================== Auth Context ====================
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  booking: BookingSession | null;
  bookingStepRoute: string | null;
  setAuthSession: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  setBooking: (booking: BookingSession) => void;
  clearBooking: () => void;
  setBookingStepRoute: (route: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const KEY_USER = 'session_user';
const KEY_ACCESS = 'session_access';
const KEY_REFRESH = 'session_refresh';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBookingState] = useState<BookingSession | null>(null);
  const [bookingStepRoute, setBookingStepRoute] = useState<string | null>(null);

  // Load persisted session on mount
  useEffect(() => {
    (async () => {
      try {
        const [access, refresh, userJson] = await Promise.all([
          AsyncStorage.getItem(KEY_ACCESS),
          AsyncStorage.getItem(KEY_REFRESH),
          AsyncStorage.getItem(KEY_USER),
        ]);
        if (access && refresh && userJson) {
          const map = JSON.parse(userJson);
          setUser({
            id: map.id,
            name: map.name,
            email: map.email,
            phone: map.phone,
            avatarUrl: map.avatarUrl,
            gender: map.gender,
            role: map.role,
          });
          setAccessToken(access);
          setRefreshToken(refresh);
        }
      } catch {
        await Promise.all([
          AsyncStorage.removeItem(KEY_USER),
          AsyncStorage.removeItem(KEY_ACCESS),
          AsyncStorage.removeItem(KEY_REFRESH)
        ]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setAuthSession = useCallback(async (u: User, at: string, rt: string) => {
    setUser(u);
    setAccessToken(at);
    setRefreshToken(rt);
    await AsyncStorage.setItem(KEY_ACCESS, at);
    await AsyncStorage.setItem(KEY_REFRESH, rt);
    await AsyncStorage.setItem(KEY_USER, JSON.stringify({
      id: u.id, name: u.name, email: u.email,
      phone: u.phone, avatarUrl: u.avatarUrl, gender: u.gender,
      role: u.role,
    }));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setBookingState(null);
    setBookingStepRoute(null);
    await Promise.all([
      AsyncStorage.removeItem(KEY_USER),
      AsyncStorage.removeItem(KEY_ACCESS),
      AsyncStorage.removeItem(KEY_REFRESH)
    ]);
  }, []);

  const setBooking = useCallback((b: BookingSession) => setBookingState(b), []);
  const clearBooking = useCallback(() => {
    setBookingState(null);
    setBookingStepRoute(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, accessToken, refreshToken,
      isLoggedIn: user !== null,
      isLoading, booking, bookingStepRoute,
      setAuthSession, signOut, setBooking, clearBooking, setBookingStepRoute,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
