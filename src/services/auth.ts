import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';

import { toAuthorizationResult, type AuthorizationResult } from '@/utils/biometrics';

/**
 * The single seam where a transfer gets authorized by the user.
 *
 * Today this is an *event-bound* check: the OS tells the app "yes, it's them",
 * and the app trusts that boolean. In production, this function's body would
 * become a server-signed challenge (a device key in the Secure Enclave /
 * Keystore signs it after biometrics), and nothing else in the app changes.
 *
 * The in-app PIN fallback isn't here because it needs UI: when this returns
 * `needs_pin`, the Review screen opens the PIN sheet, and the server checks the PIN.
 */
export async function authorizeTransfer(promptMessage: string): Promise<AuthorizationResult> {
  // Face ID isn't supported in Expo Go, and how it fails there isn't documented.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return { status: 'needs_pin', reason: 'expo_go' };
  }

  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  if (!hasHardware || !isEnrolled) {
    return { status: 'needs_pin', reason: 'no_biometrics' };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    // Biometrics or our app PIN only, never the phone's passcode: anyone who
    // knows the passcode could otherwise approve transfers.
    disableDeviceFallback: true,
    fallbackLabel: 'Use PIN',
    // Android: only Class 3 ("strong") biometrics, which excludes weaker face unlock.
    biometricsSecurityLevel: 'strong',
  });

  return toAuthorizationResult(result);
}
