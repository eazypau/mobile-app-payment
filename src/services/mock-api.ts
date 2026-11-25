import { BANKS } from '@/constants/banks';

import { MOCK_ACCOUNT, MOCK_ACCOUNT_HOLDER_NAMES, MOCK_RECIPIENTS } from './mock-data';
import type { Account, ApiErrorCode, ApiResult, Recipient, TransferReceipt, TransferRequest } from './types';

/**
 * The fake bank backend. Plain async functions with simulated latency that
 * resolve to an `ApiResult` instead of throwing.
 *
 * Magic values for demoing failures (also listed in the README):
 * - Account lookup: a number starting with `000` → ACCOUNT_NOT_FOUND
 * - Account lookup: a number starting with `999` → NETWORK
 * - Account load: set `mockSettings.simulateAccountLoadFailure = true` → NETWORK
 * - Transfer to "Test: Network error" → NETWORK (nothing happens)
 * - Transfer to "Test: Timeout" → the transfer IS processed, but the response
 *   is "lost" (TIMEOUT). Retrying with the same idempotency key returns the
 *   original receipt instead of paying twice.
 * - Transfer to "Test: Insufficient funds" → INSUFFICIENT_FUNDS, as if the
 *   balance changed somewhere else since the app last loaded it
 */

export const mockSettings = {
  latencyMs: 600,
  simulateAccountLoadFailure: false,
};

// In-memory "server database", seeded at startup and reset on every reload.
function createDb() {
  return {
    account: { ...MOCK_ACCOUNT },
    recipients: [...MOCK_RECIPIENTS],
    transactions: [] as TransferReceipt[],
    /** idempotency key → the receipt that key produced */
    processedKeys: new Map<string, TransferReceipt>(),
  };
}

let db = createDb();

/** Back to the seed data. Used by tests. */
export function resetMockServer() {
  db = createDb();
}

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, mockSettings.latencyMs));
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail<T>(code: ApiErrorCode): ApiResult<T> {
  return { ok: false, error: { code } };
}

export async function getAccount(): Promise<ApiResult<Account>> {
  await wait();
  if (mockSettings.simulateAccountLoadFailure) return fail('NETWORK');
  return ok({ ...db.account });
}

export async function getRecipients(): Promise<ApiResult<Recipient[]>> {
  await wait();
  return ok([...db.recipients]);
}

/** Name enquiry: who owns this account number at this bank? */
export async function lookupAccount(bankId: string, accountNumber: string): Promise<ApiResult<Recipient>> {
  await wait();

  if (accountNumber.startsWith('999')) return fail('NETWORK');
  const bank = BANKS.find((b) => b.id === bankId);
  if (!bank || accountNumber.startsWith('000')) return fail('ACCOUNT_NOT_FOUND');

  // Same number always gives the same name, so results are repeatable in a demo.
  const digitSum = [...accountNumber].reduce((sum, digit) => sum + Number(digit), 0);
  const name = MOCK_ACCOUNT_HOLDER_NAMES[digitSum % MOCK_ACCOUNT_HOLDER_NAMES.length];

  return ok({
    id: `lookup-${bankId}-${accountNumber}`,
    name,
    bankName: bank.name,
    accountNumber,
  });
}

/**
 * Moves money. The server re-checks balance and limit itself: the app's
 * checks are only for UX and can be stale or bypassed.
 */
export async function transfer(request: TransferRequest): Promise<ApiResult<TransferReceipt>> {
  await wait();

  // Idempotency: a key we've seen before gets its original result, never a second transfer.
  const previous = db.processedKeys.get(request.idempotencyKey);
  if (previous) return ok(previous);

  const { recipient, amountSen } = request;
  if (recipient.id === 'test-network') return fail('NETWORK');
  if (recipient.id === 'test-insufficient' || amountSen > db.account.balanceSen) return fail('INSUFFICIENT_FUNDS');
  if (amountSen > db.account.dailyLimitSen - db.account.spentTodaySen) return fail('DAILY_LIMIT_EXCEEDED');

  db.account.balanceSen -= amountSen;
  db.account.spentTodaySen += amountSen;

  const receipt: TransferReceipt = {
    reference: `TX${String(db.transactions.length + 1).padStart(6, '0')}`,
    recipient,
    amountSen,
    note: request.note,
    createdAt: new Date().toISOString(),
    balanceAfterSen: db.account.balanceSen,
  };
  db.transactions.push(receipt);
  db.processedKeys.set(request.idempotencyKey, receipt);

  // The money moved, but the app never hears back.
  if (recipient.id === 'test-timeout') return fail('TIMEOUT');

  return ok(receipt);
}
