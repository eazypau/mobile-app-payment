import type { ApiError, ApiErrorCode, ApiResult } from './types';

/**
 * Bridges our `ApiResult` union to TanStack Query, which needs a query
 * function to *throw* on failure. The error keeps its `code`, so screens can
 * still tell "not found" from "network".
 */
export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;
  readonly attemptsRemaining?: number;

  constructor(code: ApiErrorCode, attemptsRemaining?: number) {
    super(code);
    this.name = 'ApiRequestError';
    this.code = code;
    this.attemptsRemaining = attemptsRemaining;
  }

  static from(error: ApiError): ApiRequestError {
    return new ApiRequestError(error.code, error.attemptsRemaining);
  }
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  throw ApiRequestError.from(result.error);
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
    case 'TIMEOUT':
      return "We didn't hear back from the bank, so we can't confirm this transfer yet. Try again: you won't be charged twice.";
    case 'ACCOUNT_NOT_FOUND':
      return "We couldn't find that account. Check the number and the bank.";
    case 'INSUFFICIENT_FUNDS':
      return "You don't have enough money for this transfer. Your balance may have changed.";
    case 'DAILY_LIMIT_EXCEEDED':
      return "This transfer would go over today's limit.";
    case 'INVALID_PIN':
      return error.attemptsRemaining === 1
        ? 'Wrong PIN. 1 attempt left before transfers are locked.'
        : `Wrong PIN. ${error.attemptsRemaining ?? 'A few'} attempts left.`;
    case 'PIN_LOCKED':
      return 'Too many wrong PINs, so transfers are locked to protect your account. (Demo: reload the app to unlock.)';
    default: {
      // Compile error here if a new ApiErrorCode is added without a message.
      const unhandled: never = error.code;
      return unhandled;
    }
  }
}
