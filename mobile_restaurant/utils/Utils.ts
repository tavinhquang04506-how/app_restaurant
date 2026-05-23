import { buildApiBasePath } from './ApiConfig';

/**
 * API endpoint constants & utility functions.
 * Converted from Flutter Utils.dart
 */
export const apiUrl = buildApiBasePath();

// ===== Auth =====
export const LOGIN_API = '/auth/login';
export const REGISTER_API = '/auth/register';
export const LOGOUT_API = '/auth/logout';
export const FORGOT_PASSWORD_REQUEST_API = '/auth/forgot-password/request';
export const FORGOT_PASSWORD_VERIFY_API = '/auth/forgot-password/verify';
export const FORGOT_PASSWORD_RESET_API = '/auth/forgot-password/reset';

// ===== Me =====
export const ME_API = '/me';

// ===== Branches / Categories / Foods =====
export const BRANCHES_API = '/branches';
export const CATEGORIES_API = '/categories';
export const FOODS_API = '/foods';
export const BRANCHES_FOODS_API = '/branches-foods';
export const foodRatingsApi = (foodId: string) => `/foods/${foodId}/ratings`;

// ===== Booking / Tables =====
export const BOOKINGS_API = '/bookings';
export const MY_BOOKINGS_API = '/bookings/me';
export const bookingCancelApi = (bookingId: string) => `/bookings/${bookingId}/cancel`;
export const bookingRateFoodsApi = (bookingId: string) => `/bookings/${bookingId}/rate-foods`;
export const bookingDishesApi = (bookingId: string) => `/bookings/${bookingId}/dishes`;
export const tableAvailabilityApi = (branchId: string) => `/branches/${branchId}/tables/availability`;

// ===== Favorites =====
export const FAVORITES_API = '/favorites';
export const favoriteByFoodIdApi = (foodId: string) => `/favorites/${foodId}`;

// ===== Promotions =====
export const PROMOTIONS_AVAILABLE_API = '/promotions/available';

// ===== Chat =====
export const MY_CONVERSATION_API = '/chat/conversations/me';
export const chatMessagesApi = (conversationId: string) => `/chat/conversations/${conversationId}/messages`;
export const CHAT_SEND_MESSAGE_API = '/chat/messages';

// ===== Notifications =====
export const NOTIFICATIONS_API = '/notifications';
export const NOTIFICATIONS_GLOBAL_API = '/notifications/global';
export const notificationMarkReadApi = (id: string) => `/notifications/${id}/read`;

/**
 * Helper function: extract message from Error.
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Đã xảy ra lỗi không xác định';
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Bỏ dấu tiếng Việt để hỗ trợ tìm kiếm.
 */
export function normalizeVietnamese(input: string): string {
  return input
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/[đ]/g, 'd');
}

/**
 * Format table code to friendly name (e.g. VIP-Q1-2-1 -> Bàn VIP 2-1 or VIP Table 2-1)
 */
export function formatTableCode(tableCode: string | undefined, language: string = 'vi', short: boolean = false): string {
  if (!tableCode) return '';
  
  let cleanCode = tableCode.trim();
  
  // Repeatedly remove leading "bàn", "table" case-insensitively to prevent any duplication
  while (true) {
    const lower = cleanCode.toLowerCase();
    if (lower.startsWith('bàn ')) {
      cleanCode = cleanCode.substring(4).trim();
    } else if (lower.startsWith('table ')) {
      cleanCode = cleanCode.substring(6).trim();
    } else if (lower.startsWith('bàn')) {
      cleanCode = cleanCode.substring(3).trim();
    } else if (lower.startsWith('table')) {
      cleanCode = cleanCode.substring(5).trim();
    } else {
      break;
    }
  }

  // Handle standard DB code formats e.g. "STD-Q1-2-5"
  const parts = cleanCode.split('-');
  if (parts.length >= 4) {
    const isVip = parts[0].toUpperCase() === 'VIP';
    const capacity = parts[2];
    const index = parts[3];
    if (language === 'vi') {
      if (short) {
        return isVip ? `VIP ${capacity}-${index}` : `Thường ${capacity}-${index}`;
      }
      return isVip ? `Bàn VIP ${capacity}-${index}` : `Bàn Thường ${capacity}-${index}`;
    } else {
      if (short) {
        return isVip ? `VIP ${capacity}-${index}` : `Std ${capacity}-${index}`;
      }
      return isVip ? `VIP Table ${capacity}-${index}` : `Standard Table ${capacity}-${index}`;
    }
  }

  // Handle prefix styles
  if (cleanCode.toUpperCase().startsWith('VIP-')) {
    const suffix = cleanCode.substring(4);
    if (short) return `VIP ${suffix}`;
    return language === 'vi' ? `Bàn VIP ${suffix}` : `VIP Table ${suffix}`;
  }
  if (cleanCode.toUpperCase().startsWith('STD-')) {
    const suffix = cleanCode.substring(4);
    if (short) return language === 'vi' ? `Thường ${suffix}` : `Std ${suffix}`;
    return language === 'vi' ? `Bàn Thường ${suffix}` : `Standard Table ${suffix}`;
  }

  // Handle partially formatted tableCode strings e.g. "Thường 2-5" or "VIP 2-5"
  const upperClean = cleanCode.toUpperCase();
  if (upperClean.startsWith('VIP')) {
    let suffix = cleanCode.substring(3).trim();
    if (suffix.startsWith('-')) suffix = suffix.substring(1).trim();
    if (short) return `VIP ${suffix}`;
    return language === 'vi' ? `Bàn VIP ${suffix}` : `VIP Table ${suffix}`;
  }

  if (upperClean.startsWith('THƯỜNG') || upperClean.startsWith('STANDARD') || upperClean.startsWith('STD')) {
    let len = 3;
    if (upperClean.startsWith('THƯỜNG')) len = 7;
    else if (upperClean.startsWith('STANDARD')) len = 8;
    
    let suffix = cleanCode.substring(len).trim();
    if (suffix.startsWith('-')) suffix = suffix.substring(1).trim();

    if (short) return language === 'vi' ? `Thường ${suffix}` : `Std ${suffix}`;
    return language === 'vi' ? `Bàn Thường ${suffix}` : `Standard Table ${suffix}`;
  }

  // Fallback
  if (short) return cleanCode;
  return language === 'vi' ? `Bàn ${cleanCode}` : `Table ${cleanCode}`;
}

export function parseSafeDate(dateVal: any): Date {
  if (!dateVal) return new Date(0);
  
  if (typeof dateVal === 'number') {
    if (dateVal < 9999999999) {
      return new Date(dateVal * 1000);
    }
    return new Date(dateVal);
  }
  
  if (typeof dateVal === 'string') {
    if (/^\d+(\.\d+)?$/.test(dateVal)) {
      const num = Number(dateVal);
      if (num < 9999999999) {
        return new Date(num * 1000);
      }
      return new Date(num);
    }
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  if (Array.isArray(dateVal)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = dateVal;
    return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
  }

  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

