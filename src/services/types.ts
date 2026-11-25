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

export type ApiErrorCode = 'NETWORK' | 'ACCOUNT_NOT_FOUND';

/**
 * Every mock API call resolves to this union instead of throwing, so callers
 * must check `ok` before they can touch `data`.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: ApiErrorCode } };
