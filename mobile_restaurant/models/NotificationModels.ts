import { parseBaseResponse, type BaseResponse } from './AuthModels';
import { parseSafeDate } from '../utils/Utils';

// ==================== NotificationModel ====================
export interface NotificationModel {
  id?: string;
  type: string; // PROMOTION | BOOKING_REMINDER
  title: string;
  message?: string;
  image?: string;
  bookingId?: string;
  isRead: boolean;
  createdAt?: string;
  isPromotion: boolean;
  isBookingReminder: boolean;
  timeAgo: string;
}

function computeTimeAgo(createdAt?: any): string {
  if (!createdAt) return '';
  const date = parseSafeDate(createdAt);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function parseNotificationModel(json: any): NotificationModel {
  const type = json.type as string;
  return {
    id: json.id ?? undefined,
    type,
    title: json.title,
    message: json.message ?? undefined,
    image: json.image ?? undefined,
    bookingId: json.bookingId ?? undefined,
    isRead: json.isRead ?? json.read ?? false,
    createdAt: json.createdAt ?? undefined,
    isPromotion: type === 'PROMOTION',
    isBookingReminder: type === 'BOOKING_REMINDER',
    timeAgo: computeTimeAgo(json.createdAt),
  };
}

// ==================== NotificationMeta ====================
export interface NotificationMeta {
  page: number;
  pages: number;
  pageSize: number;
  total: number;
}

// ==================== NotificationListResponse ====================
export interface NotificationListResponse extends BaseResponse {
  data: NotificationModel[];
  meta?: NotificationMeta;
  hasMore: boolean;
}

export function parseNotificationListResponse(json: any): NotificationListResponse {
  const base = parseBaseResponse(json);
  let notifications: NotificationModel[] = [];
  let meta: NotificationMeta | undefined;

  const dataJson = json.data;
  if (dataJson && typeof dataJson === 'object' && !Array.isArray(dataJson)) {
    // Pagination response: { meta: {...}, result: [...] }
    const resultList = dataJson.result ?? [];
    notifications = resultList.map(parseNotificationModel);
    if (dataJson.meta) {
      meta = {
        page: Number(dataJson.meta.page),
        pages: Number(dataJson.meta.pages),
        pageSize: Number(dataJson.meta.pageSize),
        total: Number(dataJson.meta.total),
      };
    }
  } else if (Array.isArray(dataJson)) {
    notifications = dataJson.map(parseNotificationModel);
  }

  return {
    ...base,
    data: notifications,
    meta,
    hasMore: meta ? meta.page < meta.pages : false,
  };
}
