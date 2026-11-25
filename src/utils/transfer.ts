import { isApiErrorCode } from '@/services/api-error';
import type { Recipient } from '@/services/types';

type TransferFields = {
  recipient: Recipient;
  amountSen: number;
  note: string;
};

/**
 * Same recipient, amount and note means the same transfer, so it keeps its
 * idempotency key. Any edit makes it a new transfer with a new key.
 */
export function isSameTransfer(a: TransferFields, b: TransferFields): boolean {
  return a.recipient.id === b.recipient.id && a.amountSen === b.amountSen && a.note.trim() === b.note.trim();
}

/**
 * What a failed transfer should offer the user:
 * - 'retry': the request may not have gone through; retrying with the same key is safe.
 * - 'edit': the bank said no; the transfer itself has to change.
 */
export function getTransferRecovery(error: unknown): 'retry' | 'edit' {
  return isApiErrorCode(error, 'NETWORK') || isApiErrorCode(error, 'TIMEOUT') ? 'retry' : 'edit';
}
