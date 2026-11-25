import { MOCK_ACCOUNT, MOCK_RECIPIENTS } from './mock-data';
import {
  DEMO_PIN,
  getAccount,
  getRecipients,
  getTransactions,
  lookupAccount,
  mockSettings,
  resetMockServer,
  transfer,
  verifyPin,
} from './mock-api';
import type { Recipient, TransferRequest } from './types';

beforeEach(() => {
  resetMockServer();
  mockSettings.latencyMs = 0;
  mockSettings.simulateAccountLoadFailure = false;
  mockSettings.simulateHistoryLoadFailure = false;
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

describe('verifyPin', () => {
  it('accepts the demo PIN', async () => {
    expect(await verifyPin(DEMO_PIN)).toEqual({ ok: true, data: { verified: true } });
  });

  it('counts down the attempts left on a wrong PIN', async () => {
    expect(await verifyPin('000000')).toEqual({ ok: false, error: { code: 'INVALID_PIN', attemptsRemaining: 4 } });
    expect(await verifyPin('000000')).toEqual({ ok: false, error: { code: 'INVALID_PIN', attemptsRemaining: 3 } });
  });

  it('resets the count after a correct PIN', async () => {
    await verifyPin('000000');
    await verifyPin(DEMO_PIN);
    expect(await verifyPin('000000')).toEqual({ ok: false, error: { code: 'INVALID_PIN', attemptsRemaining: 4 } });
  });

  it('locks on the 5th wrong PIN, and then rejects even the right PIN', async () => {
    for (let i = 0; i < 4; i++) await verifyPin('000000');
    expect(await verifyPin('000000')).toEqual({ ok: false, error: { code: 'PIN_LOCKED' } });
    expect(await verifyPin(DEMO_PIN)).toEqual({ ok: false, error: { code: 'PIN_LOCKED' } });
  });

  it('unlocks after the server resets (the demo equivalent of an app reload)', async () => {
    for (let i = 0; i < 5; i++) await verifyPin('000000');
    resetMockServer();
    expect((await verifyPin(DEMO_PIN)).ok).toBe(true);
  });
});

describe('getTransactions', () => {
  it('returns the newest page first, with a cursor for the next one', async () => {
    const result = await getTransactions({ cursor: null, limit: 20 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(20);
    expect(result.data.nextCursor).toBe(result.data.items[19].id);

    const times = result.data.items.map((t) => new Date(t.createdAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('continues after the cursor without repeating or skipping', async () => {
    const first = await getTransactions({ cursor: null, limit: 20 });
    if (!first.ok) throw new Error('expected ok');
    const second = await getTransactions({ cursor: first.data.nextCursor, limit: 20 });
    if (!second.ok) throw new Error('expected ok');

    const all = await getTransactions({ cursor: null, limit: 40 });
    if (!all.ok) throw new Error('expected ok');
    expect([...first.data.items, ...second.data.items]).toEqual(all.data.items);
  });

  it('is not thrown off by a new transfer arriving between pages', async () => {
    const first = await getTransactions({ cursor: null, limit: 20 });
    if (!first.ok) throw new Error('expected ok');
    const lastSeen = first.data.items[19];

    await transfer({ idempotencyKey: 'k', recipient: MOCK_RECIPIENTS[0], amountSen: 1000, note: '' });

    const second = await getTransactions({ cursor: first.data.nextCursor, limit: 20 });
    if (!second.ok) throw new Error('expected ok');
    expect(second.data.items.map((t) => t.id)).not.toContain(lastSeen.id);
  });

  it('puts a new transfer at the top of the history', async () => {
    await transfer({ idempotencyKey: 'k', recipient: MOCK_RECIPIENTS[0], amountSen: 1000, note: 'Hi' });
    const result = await getTransactions({ cursor: null, limit: 1 });
    expect(result.ok && result.data.items[0]).toMatchObject({
      direction: 'out',
      counterpartyName: MOCK_RECIPIENTS[0].name,
      amountSen: 1000,
      note: 'Hi',
    });
  });

  it('returns a null cursor on the last page', async () => {
    const result = await getTransactions({ cursor: null, limit: 5000 });
    expect(result.ok && result.data.nextCursor).toBeNull();
  });

  it('fails with NETWORK when the failure flag is on', async () => {
    mockSettings.simulateHistoryLoadFailure = true;
    expect(await getTransactions({ cursor: null, limit: 20 })).toEqual({ ok: false, error: { code: 'NETWORK' } });
  });
});
