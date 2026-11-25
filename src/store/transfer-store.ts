import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

import type { Recipient, TransferReceipt, TransferRequest } from '@/services/types';
import { isSameTransfer } from '@/utils/transfer';

/**
 * Client-only state for the transfer flow. Server data (balance, recipients)
 * lives in TanStack Query instead. Kept in memory, never in route params,
 * because routes are deep-linkable URLs that anyone could pre-fill.
 */
type TransferState = {
  /** What the user is about to send. It's already a complete transfer request, including its idempotency key. */
  draft: TransferRequest | null;
  /** The last successful transfer, shown on the Success screen. */
  receipt: TransferReceipt | null;
  /** Saves the form for review. Keeps the idempotency key if the transfer hasn't changed. */
  saveDraft: (fields: { recipient: Recipient; amountSen: number; note: string }) => void;
  setReceipt: (receipt: TransferReceipt) => void;
  /** Starts a fresh flow. */
  reset: () => void;
};

export const useTransferStore = create<TransferState>()((set, get) => ({
  draft: null,
  receipt: null,

  saveDraft: (fields) => {
    const current = get().draft;
    const idempotencyKey = current && isSameTransfer(current, fields) ? current.idempotencyKey : randomUUID();
    set({ draft: { ...fields, note: fields.note.trim(), idempotencyKey } });
  },

  setReceipt: (receipt) => set({ receipt }),

  reset: () => set({ draft: null, receipt: null }),
}));
