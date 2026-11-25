import { MOCK_ACCOUNT, MOCK_RECIPIENTS } from './mock-data';
import { getAccount, getRecipients, lookupAccount, mockSettings } from './mock-api';

beforeEach(() => {
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
