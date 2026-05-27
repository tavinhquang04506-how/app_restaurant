import { buildApiBasePath } from '../utils/ApiConfig';
import { parseBaseResponse, type BaseResponse } from './AuthModels';

function resolveFoodImageUrl(fileName?: string): string | undefined {
  if (!fileName || !fileName.trim()) return undefined;
  if (/^https?:\/\//i.test(fileName)) return fileName.trim();
  return `${buildApiBasePath()}/storage/food/${fileName.trim()}`;
}

// ==================== FoodModel ====================
export interface FoodModel {
  id: string;
  name: string;
  description: string;
  thumbUrl?: string;
  price: number;
  categoryId?: string;
  categoryName?: string;
  avgRating?: number;
  ratingCount?: number;
  sold?: number;
  imageUrl?: string;
}

export function parseFoodModel(json: any): FoodModel {
  const category = json.category;
  return {
    id: json.id,
    name: json.name,
    description: json.description,
    thumbUrl: json.thumbUrl ?? undefined,
    price: Number(json.price),
    categoryId: category?.id ?? undefined,
    categoryName: category?.name ?? undefined,
    avgRating: json.avgRating != null ? Number(json.avgRating) : undefined,
    ratingCount: json.ratingCount != null ? Number(json.ratingCount) : undefined,
    sold: json.sold != null ? Number(json.sold) : undefined,
    imageUrl: resolveFoodImageUrl(json.thumbUrl),
  };
}

// ==================== PaginationMeta ====================
export interface PaginationMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export function parsePaginationMeta(json: any): PaginationMeta {
  return {
    page: Number(json.page),
    pageSize: Number(json.pageSize),
    pages: Number(json.pages),
    total: Number(json.total),
  };
}

// ==================== FoodPageResponse ====================
export interface FoodPageResponse extends BaseResponse {
  data: FoodModel[];
  meta?: PaginationMeta;
}

export function parseFoodPageResponse(json: any): FoodPageResponse {
  const base = parseBaseResponse(json);
  const payload = json.data;
  const dataMap = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const result = dataMap.result;
  const list = Array.isArray(result) ? result : [];
  return {
    ...base,
    data: list.map(parseFoodModel),
    meta: dataMap.meta ? parsePaginationMeta(dataMap.meta) : undefined,
  };
}

