import { buildApiBasePath } from '../utils/ApiConfig';
import { parseBaseResponse, type BaseResponse } from './AuthModels';
import { parseFoodModel, parsePaginationMeta, type FoodModel, type PaginationMeta } from './FoodModels';

function resolveBranchImageUrl(fileName?: string): string | undefined {
  if (!fileName || !fileName.trim()) return undefined;
  if (/^https?:\/\//i.test(fileName)) return fileName.trim();
  return `${buildApiBasePath()}/storage/branch/${fileName.trim()}`;
}

// ==================== BranchModel ====================
export interface BranchModel {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  displayImageUrl?: string;
}

export function parseBranchModel(json: any): BranchModel {
  return {
    id: json.id,
    name: json.name,
    address: json.address,
    phone: json.phone,
    imageUrl: json.imageUrl ?? undefined,
    openTime: json.openTime ?? undefined,
    closeTime: json.closeTime ?? undefined,
    displayImageUrl: resolveBranchImageUrl(json.imageUrl),
  };
}

// ==================== BranchFoodModel ====================
export interface BranchFoodModel {
  id: string;
  price: number;
  active: boolean;
  branch: BranchModel;
  food: FoodModel;
}

export function parseBranchFoodModel(json: any): BranchFoodModel {
  return {
    id: json.id,
    price: Number(json.price),
    active: json.active,
    branch: parseBranchModel(json.branch),
    food: parseFoodModel(json.food),
  };
}

// ==================== BranchListResponse ====================
export interface BranchListResponse extends BaseResponse {
  data: BranchModel[];
}

export function parseBranchListResponse(json: any): BranchListResponse {
  const base = parseBaseResponse(json);
  const raw = json.data;
  const list = Array.isArray(raw) ? raw : [];
  return {
    ...base,
    data: list.map(parseBranchModel),
  };
}

// ==================== BranchFoodPageResponse ====================
export interface BranchFoodPageResponse extends BaseResponse {
  data: BranchFoodModel[];
  meta?: PaginationMeta;
}

export function parseBranchFoodPageResponse(json: any): BranchFoodPageResponse {
  const base = parseBaseResponse(json);
  const payload = json.data;
  const dataMap = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const result = dataMap.result;
  const list = Array.isArray(result) ? result : [];
  return {
    ...base,
    data: list.map(parseBranchFoodModel),
    meta: dataMap.meta ? parsePaginationMeta(dataMap.meta) : undefined,
  };
}
