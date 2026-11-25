import { ApiRequestError, getErrorMessage, isApiErrorCode, unwrap } from './api-error';

describe('unwrap', () => {
  it('returns data for a successful result', () => {
    expect(unwrap({ ok: true, data: 42 })).toBe(42);
  });

  it('throws an ApiRequestError carrying the code for a failed result', () => {
    expect(() => unwrap({ ok: false, error: { code: 'NETWORK' } })).toThrow(ApiRequestError);
    try {
      unwrap({ ok: false, error: { code: 'ACCOUNT_NOT_FOUND' } });
    } catch (error) {
      expect(isApiErrorCode(error, 'ACCOUNT_NOT_FOUND')).toBe(true);
    }
  });
});

describe('getErrorMessage', () => {
  it('has a specific message for each API error code', () => {
    expect(getErrorMessage(new ApiRequestError('NETWORK'))).toMatch(/couldn't reach the bank/);
    expect(getErrorMessage(new ApiRequestError('ACCOUNT_NOT_FOUND'))).toMatch(/couldn't find that account/);
  });

  it('falls back to a generic message for anything else', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(getErrorMessage('nope')).toBe('Something went wrong. Please try again.');
  });
});
