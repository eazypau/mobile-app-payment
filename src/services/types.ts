/** Shared domain types. Plain TypeScript, no React. */

export type Recipient = {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
};

/** What the client knows about the user's account. The server owns these numbers. */
export type Account = {
  balanceSen: number;
  dailyLimitSen: number;
  spentTodaySen: number;
};

export type Bank = {
  id: string;
  name: string;
};

export type ApiErrorCode =
  | 'NETWORK' // request never reached the bank; nothing happened
  | 'TIMEOUT' // the bank may have processed it, but no response came back
  | 'ACCOUNT_NOT_FOUND'
  | 'INSUFFICIENT_FUNDS'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'INVALID_PIN'
  | 'PIN_LOCKED';

export type ApiError = {
  code: ApiErrorCode;
  /** Only for INVALID_PIN: how many tries are left before the PIN locks. */
  attemptsRemaining?: number;
};

/**
 * Every mock API call resolves to this union instead of throwing, so callers
 * must check `ok` before they can touch `data`.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export type TransferRequest = {
  /** Same key = same transfer. The server returns the original result for a repeated key. */
  idempotencyKey: string;
  recipient: Recipient;
  amountSen: number;
  note: string;
};

export type TransferReceipt = {
  reference: string;
  recipient: Recipient;
  amountSen: number;
  note: string;
  /** ISO 8601 timestamp from the server. */
  createdAt: string;
  balanceAfterSen: number;
};
