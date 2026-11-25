import { getPinNotice, toAuthorizationResult } from './biometrics';

describe('toAuthorizationResult', () => {
  it('authorizes on success', () => {
    expect(toAuthorizationResult({ success: true })).toEqual({ status: 'authorized' });
  });

  it('treats every kind of cancel as a quiet cancel, not an error', () => {
    for (const error of ['user_cancel', 'system_cancel', 'app_cancel'] as const) {
      expect(toAuthorizationResult({ success: false, error })).toEqual({ status: 'cancelled' });
    }
  });

  it('asks for the PIN when the user taps "Use PIN"', () => {
    expect(toAuthorizationResult({ success: false, error: 'user_fallback' })).toEqual({
      status: 'needs_pin',
      reason: 'user_chose_pin',
    });
  });

  it('asks for the PIN when biometrics are locked out', () => {
    expect(toAuthorizationResult({ success: false, error: 'lockout' })).toEqual({
      status: 'needs_pin',
      reason: 'biometrics_locked',
    });
  });

  it('asks for the PIN when biometrics are not set up', () => {
    for (const error of ['not_enrolled', 'not_available', 'passcode_not_set'] as const) {
      expect(toAuthorizationResult({ success: false, error })).toEqual({ status: 'needs_pin', reason: 'no_biometrics' });
    }
  });

  it('fails on anything else', () => {
    expect(toAuthorizationResult({ success: false, error: 'authentication_failed' })).toEqual({ status: 'failed' });
    expect(toAuthorizationResult({ success: false, error: 'unknown' })).toEqual({ status: 'failed' });
  });
});

describe('getPinNotice', () => {
  it('explains why the PIN is needed', () => {
    expect(getPinNotice('expo_go')).toMatch(/development build/);
    expect(getPinNotice('no_biometrics')).toMatch(/aren't set up/);
    expect(getPinNotice('biometrics_locked')).toMatch(/locked/);
  });

  it('says nothing when the user chose the PIN', () => {
    expect(getPinNotice('user_chose_pin')).toBeNull();
  });
});
