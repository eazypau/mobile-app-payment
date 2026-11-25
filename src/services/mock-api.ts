import { BANKS } from '@/constants/banks';

import { MOCK_ACCOUNT, MOCK_ACCOUNT_HOLDER_NAMES, MOCK_RECIPIENTS } from './mock-data';
import type { Account, ApiErrorCode, ApiResult, Recipient } from './types';

/**
 * The fake bank backend. Plain async functions with simulated latency that
 * resolve to an `ApiResult` instead of throwing.
 *
 * Magic values for demoing failures (also listed in the README):
 * - Account lookup: a number starting with `000` → ACCOUNT_NOT_FOUND
 * - Account lookup: a number starting with `999` → NETWORK
 * - Account load: set `mockSettings.simulateAccountLoadFailure = true` → NETWORK
 */

export const mockSettings = {
  latencyMs: 600,
  simulateAccountLoadFailure: false,
};

// In-memory "server database", seeded at startup and reset on every reload.
const db = {
  account: { ...MOCK_ACCOUNT },
  recipients: [...MOCK_RECIPIENTS],
};

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
