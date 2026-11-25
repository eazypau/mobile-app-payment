import { MOCK_ACCOUNT, MOCK_RECIPIENTS } from './mock-data';
import { getAccount, getRecipients, lookupAccount, mockSettings, resetMockServer, transfer } from './mock-api';
import type { Recipient, TransferRequest } from './types';

beforeEach(() => {
  resetMockServer();
  mockSettings.latencyMs = 0;
  mockSettings.simulateAccountLoadFailure = false;
});

describe('getAccount', () => {
  it('returns the seeded account', async () => {
    expect(await getAccount()).toEqual({ ok: true, data: MOCK_ACCOUNT });
  });

  it('returns a copy, so callers cannot change the server state', async () => {
    const first = await getAccount();
    if (first.ok) first.data.balanceSen = 0;
    expect(await getAccount()).toEqual({ ok: true, data: MOCK_ACCOUNT });
  });

  it('fails with NETWORK when the failure flag is on', async () => {
    mockSettings.simulateAccountLoadFailure = true;
    expect(await getAccount()).toEqual({ ok: false, error: { code: 'NETWORK' } });
  });
});

describe('getRecipients', () => {
  it('returns the saved recipients', async () => {
    expect(await getRecipients()).toEqual({ ok: true, data: MOCK_RECIPIENTS });
  });
});

describe('lookupAccount', () => {
  it('resolves the holder name and bank', async () => {
    const result = await lookupAccount('cimb', '8001234599');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bankName).toBe('CIMB Bank');
      expect(result.data.accountNumber).toBe('8001234599');
      expect(result.data.name).toMatch(/^[A-Z /]+$/);
    }
  });

  it('returns the same name for the same number', async () => {
    expect(await lookupAccount('maybank', '1234567890')).toEqual(await lookupAccount('maybank', '1234567890'));
  });

  it('fails with ACCOUNT_NOT_FOUND for numbers starting with 000', async () => {
    expect(await lookupAccount('maybank', '0001234567')).toEqual({ ok: false, error: { code: 'ACCOUNT_NOT_FOUND' } });
  });

  it('fails with ACCOUNT_NOT_FOUND for an unknown bank', async () => {
    expect(await lookupAccount('nope', '1234567890')).toEqual({ ok: false, error: { code: 'ACCOUNT_NOT_FOUND' } });
  });

  it('fails with NETWORK for numbers starting with 999', async () => {
    expect(await lookupAccount('maybank', '9991234567')).toEqual({ ok: false, error: { code: 'NETWORK' } });
  });
});

describe('transfer', () => {
  const aisyah = MOCK_RECIPIENTS[0];
  const testRecipient = (id: string): Recipient => MOCK_RECIPIENTS.find((r) => r.id === id)!;

  function request(overrides: Partial<TransferRequest> = {}): TransferRequest {
    return { idempotencyKey: 'key-1', recipient: aisyah, amountSen: 5000, note: 'Dinner', ...overrides };
  }

  async function balance() {
    const result = await getAccount();
    return result.ok ? result.data.balanceSen : NaN;
  }

  it('moves the money and returns a receipt with the new balance', async () => {
    const result = await transfer(request());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.reference).toBe('TX000001');
      expect(result.data.balanceAfterSen).toBe(MOCK_ACCOUNT.balanceSen - 5000);
    }
    expect(await balance()).toBe(MOCK_ACCOUNT.balanceSen - 5000);
  });

  it('counts towards what was spent today', async () => {
    await transfer(request());
    const result = await getAccount();
    expect(result.ok && result.data.spentTodaySen).toBe(MOCK_ACCOUNT.spentTodaySen + 5000);
  });

  it('returns the original receipt for a repeated idempotency key, without paying twice', async () => {
    const first = await transfer(request());
    const second = await transfer(request());
    expect(second).toEqual(first);
    expect(await balance()).toBe(MOCK_ACCOUNT.balanceSen - 5000);
  });

  it('treats a new key as a new transfer', async () => {
    await transfer(request({ idempotencyKey: 'key-1' }));
    await transfer(request({ idempotencyKey: 'key-2' }));
    expect(await balance()).toBe(MOCK_ACCOUNT.balanceSen - 10000);
  });

  it('NETWORK: fails without moving money', async () => {
    expect(await transfer(request({ recipient: testRecipient('test-network') }))).toEqual({
      ok: false,
      error: { code: 'NETWORK' },
    });
    expect(await balance()).toBe(MOCK_ACCOUNT.balanceSen);
  });

  it('TIMEOUT: processes the transfer, and a retry with the same key returns the original receipt', async () => {
    const timeoutRequest = request({ recipient: testRecipient('test-timeout') });

    expect(await transfer(timeoutRequest)).toEqual({ ok: false, error: { code: 'TIMEOUT' } });
    expect(await balance()).toBe(MOCK_ACCOUNT.balanceSen - 5000); // it did go through

    const retry = await transfer(timeoutRequest);
    expect(retry.ok).toBe(true);
    expect(await balance()).toBe(MOCK_ACCOUNT.balanceSen - 5000); // and only once
  });

  it('INSUFFICIENT_FUNDS: re-checks the balance on the server', async () => {
    expect(await transfer(request({ amountSen: MOCK_ACCOUNT.balanceSen + 1 }))).toEqual({
      ok: false,
      error: { code: 'INSUFFICIENT_FUNDS' },
    });
    expect(await transfer(request({ recipient: testRecipient('test-insufficient') }))).toEqual({
      ok: false,
      error: { code: 'INSUFFICIENT_FUNDS' },
    });
  });

  it('DAILY_LIMIT_EXCEEDED: re-checks the daily limit on the server', async () => {
    const remaining = MOCK_ACCOUNT.dailyLimitSen - MOCK_ACCOUNT.spentTodaySen;
    expect(await transfer(request({ amountSen: remaining + 1 }))).toEqual({
      ok: false,
      error: { code: 'DAILY_LIMIT_EXCEEDED' },
    });
    expect((await transfer(request({ amountSen: remaining }))).ok).toBe(true);
  });
});
