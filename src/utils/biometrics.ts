import type { LocalAuthenticationResult } from 'expo-local-authentication';

/** Why the app PIN is being asked for instead of (or after) biometrics. */
export type PinReason = 'expo_go' | 'no_biometrics' | 'biometrics_locked' | 'user_chose_pin';

export type AuthorizationResult =
  | { status: 'authorized' }
  /** The user backed out. Not an error: just stay on Review. */
  | { status: 'cancelled' }
  | { status: 'needs_pin'; reason: PinReason }
  | { status: 'failed' };

/** Maps the OS biometric result onto what the transfer flow should do next. */
export function toAuthorizationResult(result: LocalAuthenticationResult): AuthorizationResult {
  if (result.success) return { status: 'authorized' };

  switch (result.error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return { status: 'cancelled' };
    case 'user_fallback':
      return { status: 'needs_pin', reason: 'user_chose_pin' };
    case 'lockout':
      return { status: 'needs_pin', reason: 'biometrics_locked' };
    case 'not_enrolled':
    case 'not_available':
    case 'passcode_not_set':
      return { status: 'needs_pin', reason: 'no_biometrics' };
    default:
      return { status: 'failed' };
  }
}

/** The explanation shown above the PIN pad, or null when the user chose the PIN themselves. */
export function getPinNotice(reason: PinReason): string | null {
  switch (reason) {
    case 'expo_go':
      return 'Face ID and fingerprint need a development build, so Expo Go confirms transfers with your app PIN.';
    case 'no_biometrics':
      return "Biometrics aren't set up on this device, so confirm with your app PIN.";
    case 'biometrics_locked':
      return 'Biometrics are locked after too many tries. Confirm with your app PIN.';
    case 'user_chose_pin':
      return null;
  }
}
