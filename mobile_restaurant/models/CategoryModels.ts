import { parseBaseResponse, type BaseResponse } from './AuthModels';

// ==================== CategoryModel ====================
export interface CategoryModel {
  id: string;
  name: string;
  description?: string;
}

export function parseCategoryModel(json: any): CategoryModel {
  return {
    id: json.id,
    name: json.name,
    description: json.description ?? undefined,
  };
}

// ==================== CategoryListResponse ====================
export interface CategoryListResponse extends BaseResponse {
  data: CategoryModel[];
}

export function parseCategoryListResponse(json: any): CategoryListResponse {
  const base = parseBaseResponse(json);
  const raw = json.data;
  const list = Array.isArray(raw) ? raw : [];
  return {
    ...base,
    data: list.map(parseCategoryModel),
  };
}
