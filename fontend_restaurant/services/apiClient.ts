import { authStorage } from './authStorage';
import { tokenRefresher } from './tokenRefresher';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const getApiBaseUrl = () => {
  const envUrl =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';
  if (envUrl && !envUrl.includes('192.168.1.199')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    return `http://${hostname}:8080/api/v1`;
  }
  return 'http://localhost:8080/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_WS_BASE = API_BASE_URL.replace(/\/api\/v1$/, '');

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

const buildHeaders = (input?: HeadersInit, body?: BodyInit | null): Headers => {
  const headers = new Headers(input);
  const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isMultipart && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth, headers: customHeaders, body, ...rest } = options;
  const headers = buildHeaders(customHeaders, body);

  const attachAccessToken = (token: string | null) => {
    if (!skipAuth && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  };

  const tokens = authStorage.getTokens();
  attachAccessToken(tokens?.accessToken ?? null);

  const exec = async (): Promise<Response> =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      body,
      headers,
    });

  let response = await exec();

  if (!skipAuth && response.status === 401 && tokens?.refreshToken) {
    try {
      const newAccessToken = await tokenRefresher.refreshAccessToken();
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await exec();
    } catch {
      // refresh failed: fall through and handle as 401
    }
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && (payload as any).message) ||
      (payload && typeof payload === 'object' && 'error' in payload && (payload as any).error) ||
      response.statusText ||
      'Có lỗi xảy ra';

    if (response.status === 401) {
      authStorage.clear();
      window.location.reload();
    }

    throw new ApiError(message as string, response.status, payload);
  }

  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

