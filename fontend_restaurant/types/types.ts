
export type Page =
  | 'Dashboard'
  | 'Người dùng'
  | 'Vai trò'
  | 'Chi nhánh'
  | 'Món ăn'
  | 'Món ăn chi nhánh'
  | 'Danh mục món'
  | 'Khuyến mãi'
  | 'Chat'
  | 'Đặt bàn'
  | 'Danh sách booking'
  | 'Bàn ăn'
  | 'Phục vụ bàn & POS';

import type { IconName } from '../components/ui/Icon';

export type MenuItem = { name: Page; icon: IconName };

export type MenuItemGroup = {
  groupName?: string;
  items: MenuItem[];
};

export interface Role {
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string | null;
  role?: string;
  branchId?: string | null;
  branchName?: string | null;
}

export interface LoginResponse {
  user: LoginUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  role?: Role;
  branchId?: string | null;
  branchName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Food {
  id: string;
  name: string;
  description: string;
  thumbUrl?: string;
  price: number;
  sold?: number;
  category?: Category;
  avgRating?: number;
  ratingCount?: number;
  active?: boolean;
}

export interface BranchFood {
  id: string;
  price: number;
  active: boolean;
  branch: {
    id: string;
    name: string;
  };
  food: {
    id: string;
    name: string;
    description?: string;
    thumbUrl?: string;
  };
}

export interface BranchFoodForm {
  branchId: string;
  foodId: string;
  price: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface PaginationResult<T> {
  meta: PaginationMeta;
  result: T[];
}

export interface RestaurantTable {
  id: string;
  tableCode: string;
  capacity: number;
  location?: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
  branch?: Branch;
}

export interface TableAvailability {
  tableId: string;
  tableCode: string;
  capacity: number;
  status: RestaurantTable['status'];
  booked: boolean;
  reservedFrom?: string;
  reservedTo?: string;
}

export interface Booking {
  id: string;
  reservedFrom: string;
  reservedTo: string;
  guests: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  specialRequest?: string;
  table: RestaurantTable;
  branch: Branch;
  user: User;
  dishes?: BookingDish[];
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  promotion?: Promotion;
}

export interface BookingDish {
  id: string;
  quantity: number;
  unitPrice: number;
  servingOrder: number;
  specialNote?: string;
  food: {
    id: string;
    name: string;
    description?: string;
    thumbUrl?: string;
  };
}

export interface BookingDishPayload {
  foodId: string;
  quantity: number;
  servingOrder?: number;
  specialNote?: string;
}

export interface BookingRequestPayload {
  bookingTime: string;
  durationMinutes?: number;
  guests: number;
  specialRequest?: string;
  tableId: string;
  branchId: string;
  dishes?: BookingDishPayload[];
  promotionCode?: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  discountPercent: number;
  quantity: number;
  remaining: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'ADMIN';
  senderName?: string;
  senderId?: string;
  content: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  username: string;
  userEmail?: string;
  avatar?: string | null;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  status?: 'WAITING' | 'CONNECTED' | 'CLOSED';
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  messages?: ChatMessage[];
}
