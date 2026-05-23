// ==================== BaseResponse ====================
export interface BaseResponse {
  statusCode: number;
  message: string;
  status: boolean;
}

export function parseBaseResponse(json: any): BaseResponse {
  const statusCode = Number(json.statusCode);
  // Backend 'message' can be a string or an array of validation error strings
  let message = '';
  if (typeof json.message === 'string') {
    message = json.message;
  } else if (Array.isArray(json.message)) {
    message = json.message.filter(Boolean).join(' ; ');
  } else if (json.message != null) {
    message = String(json.message);
  }
  return {
    statusCode,
    message,
    status: statusCode >= 200 && statusCode < 300,
  };
}

// ==================== SimpleResponse ====================
export interface SimpleResponse extends BaseResponse {
  data?: any;
}

export function parseSimpleResponse(json: any): SimpleResponse {
  const base = parseBaseResponse(json);
  return { ...base, data: json.data };
}

// ==================== SessionUserModel ====================
export interface SessionUserModel {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  gender?: string; // backend: MALE/FEMALE
  role?: string;
  branchId?: string;
  branchName?: string;
}

export function parseSessionUserModel(json: any): SessionUserModel {
  if (!json.id || !json.username || !json.email) {
    throw new Error('Thiếu thông tin người dùng từ backend (id/username/email).');
  }
  return {
    id: json.id,
    username: json.username,
    email: json.email,
    phone: json.phone ?? undefined,
    avatar: json.avatar ?? undefined,
    gender: json.gender ?? undefined,
    role: json.role ?? undefined,
    branchId: json.branchId ?? undefined,
    branchName: json.branchName ?? undefined,
  };
}

// ==================== LoginResult ====================
export interface LoginResult {
  user: SessionUserModel;
  accessToken: string;
  refreshToken: string;
}

export function parseLoginResult(json: any): LoginResult {
  if (!json.accessToken || !json.refreshToken) {
    throw new Error('Thiếu token đăng nhập từ backend.');
  }
  return {
    user: parseSessionUserModel(json.user),
    accessToken: json.accessToken,
    refreshToken: json.refreshToken,
  };
}

// ==================== LoginResponseWrapper ====================
export interface LoginResponseWrapper extends BaseResponse {
  data?: LoginResult;
}

export function parseLoginResponseWrapper(json: any): LoginResponseWrapper {
  const base = parseBaseResponse(json);
  return {
    ...base,
    data: json.data && typeof json.data === 'object' ? parseLoginResult(json.data) : undefined,
  };
}

// ==================== UserResponseWrapper ====================
export interface UserResponseWrapper extends BaseResponse {
  data?: SessionUserModel;
}

export function parseUserResponseWrapper(json: any): UserResponseWrapper {
  const base = parseBaseResponse(json);
  return {
    ...base,
    data: json.data && typeof json.data === 'object' ? parseSessionUserModel(json.data) : undefined,
  };
}
