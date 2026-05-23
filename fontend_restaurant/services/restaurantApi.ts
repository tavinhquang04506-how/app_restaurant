import type {
  Branch,
  BranchFood,
  Booking,
  BookingRequestPayload,
  BookingDishPayload,
  Category,
  ChatConversation,
  ChatMessage,
  Food,
  LoginResponse,
  PaginationResult,
  Promotion,
  RefreshResponse,
  RestaurantTable,
  Role,
  TableAvailability,
  User,
} from '../types/types';
import { apiRequest, API_BASE_URL } from './apiClient';

interface FileUploadResponse {
  fileName: string;
}

const STORAGE_BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/storage`;
const buildStorageUrl = (folder: string, fileName: string) =>
  `${STORAGE_BASE_URL}/${folder}/${fileName}`;

type UploadedFile = {
  fileName: string;
  url: string;
};

const uploadFileToFolder = async (file: File, folder: string): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const response = await apiRequest<FileUploadResponse>('/files', {
    method: 'POST',
    body: formData,
  });
  return {
    fileName: response.fileName,
    url: buildStorageUrl(folder, response.fileName),
  };
};

const buildQueryString = (params?: any) => {
  if (!params) return '';
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
};

export interface LoginPayload {
  username: string;
  password: string;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  password: string;
  phone: string;
  avatarUrl?: string;
  roleName: string;
  branchId?: string;
}

export interface UpdateUserPayload {
  username: string;
  password?: string;
  phone: string;
  avatarUrl?: string;
  roleId: string;
  branchId?: string;
}

export interface CreateRolePayload {
  name: string;
}

export interface UpdateRolePayload {
  name: string;
}

export interface CreateBranchPayload {
  name: string;
  address: string;
  phone: string;
  imageUrl?: string;
  openTime: string;
  closeTime: string;
}

export interface CreateFoodPayload {
  name: string;
  description: string;
  thumbUrl?: string;
  price: number;
  categoryId: string;
}

export interface UpdateFoodPayload extends CreateFoodPayload {}

export interface BranchFoodQuery {
  page?: number;
  size?: number;
  branchId?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
}

export interface CreateBranchFoodPayload {
  branchId: string;
  foodId: string;
  price: number;
  quantity?: number;
}

export interface AvailabilityQuery {
  branchId: string;
  start: string;
  durationMinutes?: number;
}

export interface BookingQuery {
  branchId?: string;
  date?: string;
}

export interface PromotionPayload {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  discountPercent: number;
  quantity: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
}

export interface ChatSendPayload {
  conversationId?: string;
  targetUserId?: string;
  content: string;
}

export const restaurantApi = {
  login(payload: LoginPayload) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  logout(refreshToken: string) {
    return apiRequest<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  refresh(refreshToken: string) {
    return apiRequest<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });
  },

  getUsers(params?: { page?: number; size?: number; username?: string; email?: string }) {
    const query = buildQueryString(params);
    return apiRequest<PaginationResult<User>>(`/users${query}`);
  },

  createUser(payload: CreateUserPayload) {
    return apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        username: payload.username,
        password: payload.password,
        phone: payload.phone,
        avatarUrl: payload.avatarUrl,
        role: { name: payload.roleName },
        branchId: payload.branchId,
      }),
    });
  },

  updateUser(id: string, payload: UpdateUserPayload) {
    return apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        username: payload.username,
        password: payload.password,
        phone: payload.phone,
        avatarUrl: payload.avatarUrl,
        roleId: payload.roleId,
        branchId: payload.branchId,
      }),
    });
  },

  deleteUser(id: string) {
    return apiRequest<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  getRoles() {
    return apiRequest<Role[]>('/roles');
  },

  createRole(payload: CreateRolePayload) {
    return apiRequest<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateRole(id: string, payload: UpdateRolePayload) {
    return apiRequest<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteRole(id: string) {
    return apiRequest<void>(`/roles/${id}`, { method: 'DELETE' });
  },

  getBranches() {
    return apiRequest<Branch[]>('/branches');
  },

  createBranch(payload: CreateBranchPayload) {
    return apiRequest<Branch>('/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBranch(id: string, payload: CreateBranchPayload) {
    return apiRequest<Branch>(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteBranch(id: string) {
    return apiRequest<void>(`/branches/${id}`, {
      method: 'DELETE',
    });
  },

  getFoods(params?: { page?: number; size?: number; name?: string; categoryId?: string }) {
    const query = buildQueryString(params);
    return apiRequest<PaginationResult<Food>>(`/foods${query}`);
  },

  createFood(payload: CreateFoodPayload) {
    return apiRequest<Food>('/foods', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateFood(id: string, payload: UpdateFoodPayload) {
    return apiRequest<Food>(`/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteFood(id: string) {
    return apiRequest<void>(`/foods/${id}`, {
      method: 'DELETE',
    });
  },

  uploadFoodImage(file: File) {
    return uploadFileToFolder(file, 'food');
  },

  uploadPromotionImage(file: File) {
    return uploadFileToFolder(file, 'promotion');
  },

  uploadBranchImage(file: File) {
    return uploadFileToFolder(file, 'branch');
  },

  getCategories() {
    return apiRequest<Category[]>('/categories');
  },

  createCategory(payload: { name: string; description: string }) {
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBranchFoods(params?: BranchFoodQuery) {
    const query = buildQueryString(params);
    return apiRequest<PaginationResult<BranchFood>>(`/branches-foods${query}`);
  },

  createBranchFood(payload: CreateBranchFoodPayload) {
    return apiRequest<BranchFood>('/branches-foods', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBranchFoodActive(id: string, active: boolean) {
    return apiRequest<BranchFood>(`/branch-food/${id}/active`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
  },

  updateBranchFoodPrice(id: string, price: number) {
    return apiRequest<BranchFood>(`/branch-food/${id}/price`, {
      method: 'PUT',
      body: JSON.stringify({ price }),
    });
  },

  deleteBranchFood(id: string) {
    return apiRequest<void>(`/branch-food/${id}`, {
      method: 'DELETE',
    });
  },

  getTablesByBranch(branchId: string) {
    return apiRequest<RestaurantTable[]>(`/branches/${branchId}/tables`);
  },

  createTable(payload: { branchId: string; tableCode: string; capacity: number; location?: string }) {
    return apiRequest<RestaurantTable>('/tables', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTableAvailability(params: AvailabilityQuery) {
    const searchParams = new URLSearchParams({
      start: params.start,
      durationMinutes: String(params.durationMinutes ?? 120),
    });
    return apiRequest<TableAvailability[]>(
      `/branches/${params.branchId}/tables/availability?${searchParams.toString()}`
    );
  },

  createBooking(payload: BookingRequestPayload) {
    return apiRequest<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBookings(params?: BookingQuery) {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.date) searchParams.append('date', params.date);
    const query = searchParams.toString();
    return apiRequest<Booking[]>(`/bookings${query ? `?${query}` : ''}`);
  },

  cancelBooking(id: string) {
    return apiRequest<Booking>(`/bookings/${id}/cancel`, {
      method: 'POST',
    });
  },

  completeBooking(id: string) {
    return apiRequest<Booking>(`/bookings/${id}/complete`, {
      method: 'POST',
    });
  },

  updateTableStatus(id: string, status: string) {
    return apiRequest<RestaurantTable>(`/tables/${id}/status?status=${status}`, {
      method: 'PUT',
    });
  },

  updateBookingDishes(id: string, dishes: BookingDishPayload[]) {
    return apiRequest<Booking>(`/bookings/${id}/dishes`, {
      method: 'PUT',
      body: JSON.stringify(dishes),
    });
  },

  checkInBooking(id: string) {
    return apiRequest<Booking>(`/bookings/${id}/check-in`, {
      method: 'POST',
    });
  },

  getPromotions() {
    return apiRequest<Promotion[]>('/promotions');
  },

  getAvailablePromotions() {
    return apiRequest<Promotion[]>('/promotions/available');
  },

  createPromotion(payload: PromotionPayload) {
    return apiRequest<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updatePromotion(id: string, payload: PromotionPayload) {
    return apiRequest<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deletePromotion(id: string) {
    return apiRequest<void>(`/promotions/${id}`, {
      method: 'DELETE',
    });
  },

  getChatConversations() {
    return apiRequest<ChatConversation[]>('/chat/conversations');
  },

  getMyConversation() {
    return apiRequest<ChatConversation>('/chat/conversations/me');
  },

  getChatMessages(conversationId: string) {
    return apiRequest<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
  },

  sendChatMessage(payload: ChatSendPayload) {
    return apiRequest<ChatMessage>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  connectConversation(conversationId: string) {
    return apiRequest<ChatConversation>(`/chat/conversations/${conversationId}/connect`, {
      method: 'POST',
    });
  },

  closeConversation(conversationId: string) {
    return apiRequest<ChatConversation>(`/chat/conversations/${conversationId}/close`, {
      method: 'POST',
    });
  },
};

