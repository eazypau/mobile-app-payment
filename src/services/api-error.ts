import type { ApiErrorCode, ApiResult } from './types';

/**
 * Bridges our `ApiResult` union to TanStack Query, which needs a query
 * function to *throw* on failure. The error keeps its `code`, so screens can
 * still tell "not found" from "network".
 */
export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode) {
    super(code);
    this.name = 'ApiRequestError';
    this.code = code;
  }
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  throw new ApiRequestError(result.error.code);
}

export function isApiErrorCode(error: unknown, code: ApiErrorCode): boolean {
  return error instanceof ApiRequestError && error.code === code;
}

/** User-facing copy for any error a query or action can produce. */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'NETWORK':
      return "We couldn't reach the bank. Check your connection and try again.";
    case 'ACCOUNT_NOT_FOUND':
      return "We couldn't find that account. Check the number and the bank.";
    default: {
      // Compile error here if a new ApiErrorCode is added without a message.
      const unhandled: never = error.code;
      return unhandled;
    }
  }
}
