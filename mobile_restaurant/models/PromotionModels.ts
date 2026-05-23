import { buildApiBasePath } from '../utils/ApiConfig';
import { parseBaseResponse, type BaseResponse } from './AuthModels';

function resolvePromotionImageUrl(value?: string): string | undefined {
  if (!value || !value.trim()) return undefined;
  if (/^https?:\/\//i.test(value)) return value.trim();
  return `${buildApiBasePath()}/storage/promotion/${value.trim()}`;
}

// ==================== PromotionModel ====================
export interface PromotionModel {
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
  hasStock: boolean;
  displayImageUrl?: string;
}

export function parsePromotionModel(json: any): PromotionModel {
  const remaining = Number(json.remaining);
  return {
    id: json.id,
    code: json.code,
    name: json.name,
    description: json.description ?? undefined,
    imageUrl: json.imageUrl ?? undefined,
    discountPercent: Number(json.discountPercent),
    quantity: Number(json.quantity),
    remaining,
    active: json.active,
    startDate: json.startDate ?? undefined,
    endDate: json.endDate ?? undefined,
    hasStock: remaining > 0,
    displayImageUrl: resolvePromotionImageUrl(json.imageUrl),
  };
}

// ==================== PromotionListResponse ====================
export interface PromotionListResponse extends BaseResponse {
  data: PromotionModel[];
}

export function parsePromotionListResponse(json: any): PromotionListResponse {
  const base = parseBaseResponse(json);
  const raw = json.data;
  const list = Array.isArray(raw) ? raw : [];
  return {
    ...base,
    data: list.map(parsePromotionModel),
  };
}
