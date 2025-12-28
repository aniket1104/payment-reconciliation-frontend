/**
 * API Client
 *
 * Typed fetch wrapper for backend API communication.
 * Handles JSON serialization, error handling, and response typing.
 */

import { env } from '@/config/env';
import type { ApiError } from './types';

// =============================================================================
// Types
// =============================================================================

/**
 * HTTP methods supported by the API client
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request configuration options
 */
interface RequestOptions {
  /** Query parameters to append to URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Request body (for POST/PUT/PATCH) */
  body?: unknown;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

/**
 * API client error with structured information
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string = 'API_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiClientError);
    }
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build URL with query parameters
 */
function buildUrl(
  endpoint: string,
  params?: RequestOptions['params']
): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = new URL(`${env.apiBaseUrl}${normalizedEndpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Get default request headers
 */
function getDefaultHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Handle API response and extract data
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle no content responses
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    // Try to parse error response
    if (isJson) {
      try {
        const errorData = (await response.json()) as ApiError;
        throw new ApiClientError(
          errorData.error?.message || 'An error occurred',
          response.status,
          errorData.error?.code || 'API_ERROR',
          errorData.error?.details
        );
      } catch (e) {
        if (e instanceof ApiClientError) throw e;
        // Fall through to generic error
      }
    }

    // Generic error for non-JSON responses
    throw new ApiClientError(
      `Request failed with status ${response.status}`,
      response.status
    );
  }

  // Parse successful JSON response
  if (isJson) {
    const data = await response.json();
    return data as T;
  }

  // Handle non-JSON responses
  const text = await response.text();
  return text as unknown as T;
}

/**
 * Make an HTTP request
 */
async function request<T>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, body, signal } = options;

  const url = buildUrl(endpoint, params);

  const requestInit: RequestInit = {
    method,
    headers: {
      ...getDefaultHeaders(),
      ...headers,
    },
    signal,
  };

  // Add body for non-GET requests
  if (body !== undefined && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestInit);
    return handleResponse<T>(response);
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiClientError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    // Handle abort errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError('Request was cancelled', 0, 'ABORT_ERROR');
    }

    // Unknown error
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

// =============================================================================
// API Client
// =============================================================================

/**
 * Typed API client for backend communication
 *
 * @example
 * ```ts
 * // GET request
 * const batch = await api.get<ApiResponse<ReconciliationBatch>>('/reconciliation/123');
 *
 * // POST request with body
 * const result = await api.post<ApiResponse<void>>('/transactions/confirm', {
 *   transactionId: '123',
 *   invoiceId: '456'
 * });
 *
 * // GET with query params
 * const transactions = await api.get<PaginatedResponse<BankTransaction>>(
 *   '/transactions',
 *   { params: { page: 1, limit: 20, status: 'NEEDS_REVIEW' } }
 * );
 * ```
 */
export const api = {
  /**
   * Make a GET request
   */
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('GET', endpoint, options);
  },

  /**
   * Make a POST request
   */
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', endpoint, { ...options, body });
  },

  /**
   * Make a PUT request
   */
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', endpoint, { ...options, body });
  },

  /**
   * Make a PATCH request
   */
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', endpoint, { ...options, body });
  },

  /**
   * Make a DELETE request
   */
  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return request<T>('DELETE', endpoint, options);
  },

  /**
   * Upload a file using multipart/form-data
   */
  async upload<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, string>,
    options?: Pick<RequestOptions, 'signal'>
  ): Promise<T> {
    const url = buildUrl(endpoint);
    const formData = new FormData();

    formData.append(fieldName, file);

    // Add any additional form fields
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        // Don't set Content-Type header - browser will set it with boundary
        headers: {
          Accept: 'application/json',
        },
        body: formData,
        signal: options?.signal,
      });

      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiClientError(
          'Network error. Please check your connection.',
          0,
          'NETWORK_ERROR'
        );
      }

      throw new ApiClientError(
        error instanceof Error ? error.message : 'Upload failed',
        0,
        'UPLOAD_ERROR'
      );
    }
  },
} as const;

export default api;

