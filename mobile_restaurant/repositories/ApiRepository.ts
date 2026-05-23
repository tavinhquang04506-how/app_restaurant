import { getJson, postJson, putJson, deleteJson, apiClient } from './HttpRepository';
import { Platform } from 'react-native';
import * as U from '../utils/Utils';
import {
  parseLoginResponseWrapper, parseSimpleResponse, parseUserResponseWrapper,
  type LoginResponseWrapper, type SimpleResponse, type UserResponseWrapper,
} from '../models/AuthModels';
import { parseBranchListResponse, parseBranchFoodPageResponse, type BranchListResponse, type BranchFoodPageResponse } from '../models/BranchModels';
import { parseCategoryListResponse, type CategoryListResponse } from '../models/CategoryModels';
import { parseFoodPageResponse, parseFavoriteFoodListResponse, type FoodPageResponse, type FavoriteFoodListResponse } from '../models/FoodModels';
import {
  parseBookingResponseWrapper, parseBookingListResponse, parseTableAvailabilityListResponse,
  type BookingResponseWrapper, type BookingListResponse, type BookingRequestPayload, type TableAvailabilityListResponse,
} from '../models/BookingModels';
import { parsePromotionListResponse, type PromotionListResponse } from '../models/PromotionModels';
import {
  parseChatConversationResponseWrapper, parseChatMessageResponseWrapper,
  type ChatConversationResponseWrapper, type ChatMessageResponseWrapper,
} from '../models/ChatModels';
import { parseNotificationListResponse, type NotificationListResponse } from '../models/NotificationModels';

// ===== Auth =====
export async function login(email: string, password: string): Promise<LoginResponseWrapper> {
  const json = await postJson(U.LOGIN_API, { body: { username: email, password } });
  const res = parseLoginResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function register(data: {
  username: string; email: string; phone: string; password: string; confirmPassword: string;
}): Promise<SimpleResponse> {
  const json = await postJson(U.REGISTER_API, { body: data });
  const res = parseSimpleResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function logout(refreshToken: string): Promise<SimpleResponse> {
  const json = await postJson(U.LOGOUT_API, { body: { refreshToken } });
  const res = parseSimpleResponse(json);
  if (!res.status && res.statusCode !== 204) throw new Error(res.message);
  return res;
}

export async function requestPasswordOtp(email: string): Promise<SimpleResponse> {
  const json = await postJson(U.FORGOT_PASSWORD_REQUEST_API, { body: { email } });
  const res = parseSimpleResponse(json);
  if (!res.status && res.statusCode !== 204) throw new Error(res.message);
  return res;
}

export async function verifyPasswordOtp(email: string, otp: string): Promise<SimpleResponse> {
  const json = await postJson(U.FORGOT_PASSWORD_VERIFY_API, { body: { email, otp } });
  const res = parseSimpleResponse(json);
  if (!res.status && res.statusCode !== 204) throw new Error(res.message);
  return res;
}

export async function resetPassword(data: {
  email: string; otp: string; password: string; confirmPassword: string;
}): Promise<SimpleResponse> {
  const json = await postJson(U.FORGOT_PASSWORD_RESET_API, { body: data });
  const res = parseSimpleResponse(json);
  if (!res.status && res.statusCode !== 204) throw new Error(res.message);
  return res;
}

export async function loginWithGoogleIdToken(idToken: string): Promise<LoginResponseWrapper> {
  const json = await postJson('/auth/google', { body: { idToken } });
  const res = parseLoginResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

// ===== Me =====
export async function getMe(): Promise<UserResponseWrapper> {
  const json = await getJson(U.ME_API);
  const res = parseUserResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function updateMe(data: {
  username: string; phone: string; avatarUrl?: string; gender?: string;
}): Promise<UserResponseWrapper> {
  const body: any = { username: data.username, phone: data.phone };
  if (data.avatarUrl) body.avatarUrl = data.avatarUrl;
  if (data.gender) body.gender = data.gender;
  const json = await putJson(U.ME_API, { body });
  const res = parseUserResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

// ===== Branches =====
export async function getBranches(): Promise<BranchListResponse> {
  const json = await getJson(U.BRANCHES_API);
  const res = parseBranchListResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

// ===== Categories =====
export async function getCategories(): Promise<CategoryListResponse> {
  const json = await getJson(U.CATEGORIES_API);
  const res = parseCategoryListResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

// ===== Foods =====
export async function getFoods(opts?: {
  page?: number; size?: number; name?: string; categoryId?: string;
}): Promise<FoodPageResponse> {
  const json = await getJson(U.FOODS_API, {
    query: { page: opts?.page ?? 1, size: opts?.size ?? 20, name: opts?.name, categoryId: opts?.categoryId },
  });
  const res = parseFoodPageResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function getBranchFoods(opts: {
  branchId: string; page?: number; size?: number; keyword?: string; categoryId?: string;
}): Promise<BranchFoodPageResponse> {
  const json = await getJson(U.BRANCHES_FOODS_API, {
    query: { branchId: opts.branchId, page: opts.page ?? 1, size: opts.size ?? 20, keyword: opts.keyword, categoryId: opts.categoryId },
  });
  const res = parseBranchFoodPageResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

// ===== Favorites =====
export async function getFavorites(): Promise<FavoriteFoodListResponse> {
  const json = await getJson(U.FAVORITES_API);
  const res = parseFavoriteFoodListResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function addFavorite(foodId: string): Promise<void> {
  const json = await postJson(U.FAVORITES_API, { body: { foodId } });
  const statusCode = json && json.statusCode !== undefined ? Number(json.statusCode) : 201;
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(json?.message || 'Không thể thêm yêu thích');
  }
}

export async function removeFavorite(foodId: string): Promise<void> {
  const json = await deleteJson(U.favoriteByFoodIdApi(foodId));
  const statusCode = json && json.statusCode !== undefined ? Number(json.statusCode) : 204;
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(json?.message || 'Không thể xoá yêu thích');
  }
}

// ===== Bookings =====
export async function createBooking(payload: BookingRequestPayload): Promise<BookingResponseWrapper> {
  const json = await postJson(U.BOOKINGS_API, { body: payload });
  const res = parseBookingResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function cancelBooking(bookingId: string): Promise<BookingResponseWrapper> {
  const json = await postJson(U.bookingCancelApi(bookingId));
  const res = parseBookingResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function getMyBookings(): Promise<BookingListResponse> {
  const json = await getJson(U.MY_BOOKINGS_API);
  const res = parseBookingListResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function rateFoodsInBooking(bookingId: string, rating: number, comment?: string): Promise<void> {
  const body: any = { rating };
  if (comment) body.comment = comment;
  await postJson(U.bookingRateFoodsApi(bookingId), { body });
}

export async function getTableAvailability(opts: {
  branchId: string; start: string; guests: number; durationMinutes?: number;
}): Promise<TableAvailabilityListResponse> {
  const json = await getJson(U.tableAvailabilityApi(opts.branchId), {
    query: { start: opts.start, guests: opts.guests, durationMinutes: opts.durationMinutes ?? 120 },
  });
  const res = parseTableAvailabilityListResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

// ===== Promotions =====
export async function getAvailablePromotions(): Promise<PromotionListResponse> {
  const json = await getJson(U.PROMOTIONS_AVAILABLE_API);
  const res = parsePromotionListResponse(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

// ===== Chat =====
export async function getMyConversation(): Promise<ChatConversationResponseWrapper> {
  const json = await getJson(U.MY_CONVERSATION_API);
  const res = parseChatConversationResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function sendChatMessage(data: {
  conversationId?: string; targetUserId?: string; content: string;
}): Promise<ChatMessageResponseWrapper> {
  const body: any = { content: data.content };
  if (data.conversationId) body.conversationId = data.conversationId;
  if (data.targetUserId) body.targetUserId = data.targetUserId;
  const json = await postJson(U.CHAT_SEND_MESSAGE_API, { body });
  const res = parseChatMessageResponseWrapper(json);
  if (!res.status) throw new Error(res.message);
  return res;
}

export async function closeMyConversation(conversationId: string): Promise<void> {
  await postJson(`/chat/conversations/${conversationId}/close`);
}

// ===== Notifications =====
export async function getGlobalNotifications(page = 1, size = 10): Promise<NotificationListResponse> {
  const json = await getJson(U.NOTIFICATIONS_GLOBAL_API, { query: { page: page - 1, size } });
  return parseNotificationListResponse(json);
}

export async function getMyNotifications(page = 1, size = 10): Promise<NotificationListResponse> {
  const json = await getJson(U.NOTIFICATIONS_API, { query: { page: page - 1, size } });
  return parseNotificationListResponse(json);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await putJson(U.notificationMarkReadApi(notificationId));
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await putJson('/notifications/read-all');
}

// ===== Extra Food & Booking Dishes Endpoints =====
export async function getFoodRatings(foodId: string): Promise<any> {
  const json = await getJson(U.foodRatingsApi(foodId));
  return json;
}

export async function updateBookingDishes(
  bookingId: string,
  dishes: { foodId: string; quantity: number; specialNote?: string; servingOrder?: number }[]
): Promise<any> {
  const json = await putJson(U.bookingDishesApi(bookingId), { body: dishes });
  return json;
}

export async function uploadFile(fileUri: string, folder: string): Promise<{ fileName: string }> {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('file', {
    uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
    name: filename,
    type,
  } as any);
  formData.append('folder', folder);

  const json: any = await apiClient.post('/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (json.statusCode < 200 || json.statusCode >= 300) {
    throw new Error(json.message || 'Không thể tải ảnh lên');
  }
  return json.data;
}
