/**
 * The single seam where a transfer gets authorized by the user.
 *
 * Slice 4 puts the biometric prompt (with an in-app PIN fallback) here. In
 * production, this function's body would become a server-signed challenge
 * (a device key in the Secure Enclave / Keystore signs it after biometrics),
 * and nothing else in the app would change.
 */
export type AuthorizationResult = { ok: true } | { ok: false };

export async function authorizeTransfer(): Promise<AuthorizationResult> {
  // Stub until slice 4: every transfer is authorized.
  return { ok: true };
}
