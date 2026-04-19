export type ApiErrorPayload = {
  message: string;
  status: number;
  code: string;
  details?: unknown;
};

export const API_BASE_URL =
  process.env.REACT_NATIVE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'https://steelestimate-backend.onrender.com';

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Check your connection and try again.';
const DEFAULT_TIMEOUT_ERROR_MESSAGE = 'Request timed out. Please try again.';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function normalizeError(response: Response, body: unknown): ApiError {
  if (body && typeof body === 'object' && 'message' in body && typeof (body as { message?: unknown }).message === 'string') {
    return new ApiError({
      message: (body as { message: string }).message,
      status: response.status,
      code: response.statusText || 'HTTP_ERROR',
      details: body,
    });
  }

  return new ApiError({
    message: `Request failed with status ${response.status}`,
    status: response.status,
    code: response.statusText || 'HTTP_ERROR',
    details: body,
  });
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = createTimeoutController(timeoutMs);
  const signal = init.signal ?? controller.signal;

  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });

    const body = await parseResponse(response);

    if (!response.ok) {
      throw normalizeError(response, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new ApiError({
        message: DEFAULT_TIMEOUT_ERROR_MESSAGE,
        status: 408,
        code: 'REQUEST_TIMEOUT',
      });
    }

    throw new ApiError({
      message: error instanceof Error ? error.message : DEFAULT_NETWORK_ERROR_MESSAGE,
      status: 0,
      code: 'NETWORK_ERROR',
      details: error,
    });
  } finally {
    controller.abort();
  }
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}