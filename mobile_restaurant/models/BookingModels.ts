import { parseBaseResponse, type BaseResponse } from './AuthModels';
import { parseFoodModel, type FoodModel } from './FoodModels';
import { parseBranchModel, type BranchModel } from './BranchModels';
import { parsePromotionModel, type PromotionModel } from './PromotionModels';

// ==================== BookingTableModel ====================
export interface BookingTableModel {
  id: string;
  tableCode: string;
  capacity: number;
  location?: string;
  status?: string;
}

export function parseBookingTableModel(json: any): BookingTableModel {
  return {
    id: json.id,
    tableCode: json.tableCode,
    capacity: Number(json.capacity),
    location: json.location ?? undefined,
    status: json.status ?? undefined,
  };
}

// ==================== TableAvailabilityModel ====================
export interface TableAvailabilityModel {
  tableId: string;
  tableCode: string;
  capacity: number;
  status: string;
  booked: boolean;
  reservedFrom?: string;
  reservedTo?: string;
}

export function parseTableAvailabilityModel(json: any): TableAvailabilityModel {
  return {
    tableId: json.tableId,
    tableCode: json.tableCode,
    capacity: Number(json.capacity),
    status: json.status,
    booked: json.booked,
    reservedFrom: json.reservedFrom ?? undefined,
    reservedTo: json.reservedTo ?? undefined,
  };
}

// ==================== BookingDishModel ====================
export interface BookingDishModel {
  id: string;
  quantity: number;
  unitPrice: number;
  servingOrder: number;
  specialNote?: string;
  food?: FoodModel;
  totalPrice: number;
}

export function parseBookingDishModel(json: any): BookingDishModel {
  const qty = Number(json.quantity);
  const price = Number(json.unitPrice);
  return {
    id: json.id,
    quantity: qty,
    unitPrice: price,
    servingOrder: Number(json.servingOrder),
    specialNote: json.specialNote ?? undefined,
    food: json.food ? parseFoodModel(json.food) : undefined,
    totalPrice: qty * price,
  };
}

// ==================== BookingDishPayload ====================
export interface BookingDishPayload {
  foodId: string;
  quantity: number;
  servingOrder: number;
  specialNote?: string;
}

// ==================== BookingRequestPayload ====================
export interface BookingRequestPayload {
  bookingTime: string; // ISO 8601
  guests: number;
  tableId: string;
  branchId: string;
  specialRequest?: string;
  dishes?: BookingDishPayload[];
  promotionCode?: string;
  durationMinutes?: number;
}

// ==================== BookingResponseModel ====================
export interface BookingResponseModel {
  id: string;
  reservedFrom: string;
  reservedTo: string;
  guests: number;
  status: string;
  specialRequest?: string;
  branch?: BranchModel;
  table?: BookingTableModel;
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  promotion?: PromotionModel;
  dishes: BookingDishModel[];
  branchName: string;
  tableCode: string;
  computedSubtotal: number;
  computedDiscount: number;
  computedTotal: number;
  rated: boolean;
  depositAmount?: number;
  depositRefunded?: boolean;
}

export function parseBookingResponseModel(json: any): BookingResponseModel {
  const dishes = (json.dishes as any[] ?? []).map(parseBookingDishModel);
  const subtotalAmount = json.subtotalAmount != null ? Number(json.subtotalAmount) : undefined;
  const discountAmount = json.discountAmount != null ? Number(json.discountAmount) : undefined;
  const totalAmount = json.totalAmount != null ? Number(json.totalAmount) : undefined;
  const depositAmount = json.depositAmount != null ? Number(json.depositAmount) : undefined;
  const depositRefunded = json.depositRefunded !== undefined ? !!json.depositRefunded : undefined;

  const computedSubtotal = subtotalAmount ?? dishes.reduce((sum, d) => sum + d.totalPrice, 0);
  const computedDiscount = discountAmount ?? 0;
  const computedTotal = totalAmount ?? Math.max(0, computedSubtotal - computedDiscount);

  return {
    id: json.id,
    reservedFrom: json.reservedFrom,
    reservedTo: json.reservedTo,
    guests: Number(json.guests),
    status: json.status,
    specialRequest: json.specialRequest ?? undefined,
    branch: json.branch ? parseBranchModel(json.branch) : undefined,
    table: json.table ? parseBookingTableModel(json.table) : undefined,
    subtotalAmount,
    discountAmount,
    totalAmount,
    depositAmount,
    depositRefunded,
    promotion: json.promotion ? parsePromotionModel(json.promotion) : undefined,
    dishes,
    branchName: json.branch?.name ?? '',
    tableCode: json.table?.tableCode ?? '',
    computedSubtotal,
    computedDiscount,
    computedTotal,
    rated: !!json.rated,
  };
}

// ==================== BookingListResponse ====================
export interface BookingListResponse extends BaseResponse {
  data: BookingResponseModel[];
}

export function parseBookingListResponse(json: any): BookingListResponse {
  const base = parseBaseResponse(json);
  const raw = json.data;
  const list = Array.isArray(raw) ? raw : [];
  return {
    ...base,
    data: list.map(parseBookingResponseModel),
  };
}

// ==================== BookingResponseWrapper ====================
export interface BookingResponseWrapper extends BaseResponse {
  data?: BookingResponseModel;
}

export function parseBookingResponseWrapper(json: any): BookingResponseWrapper {
  const base = parseBaseResponse(json);
  return {
    ...base,
    data: json.data && typeof json.data === 'object' ? parseBookingResponseModel(json.data) : undefined,
  };
}

// ==================== TableAvailabilityListResponse ====================
export interface TableAvailabilityListResponse extends BaseResponse {
  data: TableAvailabilityModel[];
}

export function parseTableAvailabilityListResponse(json: any): TableAvailabilityListResponse {
  const base = parseBaseResponse(json);
  const raw = json.data;
  const list = Array.isArray(raw) ? raw : [];
  return {
    ...base,
    data: list.map(parseTableAvailabilityModel),
  };
}
