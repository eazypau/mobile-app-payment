import { z } from 'zod';

import type { Account, Recipient } from '@/services/types';

import { formatSen } from './money';

/**
 * Transfer validation, split the way real systems split it:
 * - Shape rules (Zod) depend only on what the user entered.
 * - Business rules (`checkTransferAllowed`) depend on account state the form
 *   doesn't own. The server enforces them for real; here they're for UX.
 */

export const MIN_TRANSFER_SEN = 100; // RM 1.00
export const NOTE_MAX_LENGTH = 50;

export type TransferForm = {
  recipient: Recipient | null;
  amountSen: number;
  note: string;
};

export type TransferField = keyof TransferForm;
export type FieldErrors = Partial<Record<TransferField, string>>;

const transferFormSchema = z.object({
  recipient: z.object({ id: z.string().min(1) }, { error: 'Choose who to send to' }),
  amountSen: z
    .number()
    .int()
    .positive({ error: 'Enter an amount' })
    .min(MIN_TRANSFER_SEN, { error: `The minimum transfer is ${formatSen(MIN_TRANSFER_SEN)}` }),
  note: z.string().trim().max(NOTE_MAX_LENGTH, { error: `Keep the note under ${NOTE_MAX_LENGTH} characters` }),
});

/** How much is left of today's limit, never below zero. */
export function getRemainingDailyLimit(account: Account): number {
  return Math.max(0, account.dailyLimitSen - account.spentTodaySen);
}

/**
 * Business rules for the amount. Returns an error message, or null if allowed.
 * Balance is checked first: "you don't have the money" is the more basic problem.
 */
export function checkTransferAllowed(amountSen: number, account: Account): string | null {
  if (amountSen > account.balanceSen) {
    return `This is more than your available balance of ${formatSen(account.balanceSen)}`;
  }

  const remaining = getRemainingDailyLimit(account);
  if (amountSen > remaining) {
    return `This is over your daily limit. You can send up to ${formatSen(remaining)} more today`;
  }

  return null;
}

/** All errors for the form, at most one message per field. An empty object means valid. */
export function validateTransfer(form: TransferForm, account: Account): FieldErrors {
  const errors: FieldErrors = {};

  const result = transferFormSchema.safeParse(form);
  if (!result.success) {
    // Zod reports every failing rule; keep only the first one per field.
    for (const issue of result.error.issues) {
      const field = issue.path[0] as TransferField;
      errors[field] ??= issue.message;
    }
  }

  // Only check limits once the amount itself is well-formed.
  if (!errors.amountSen) {
    const limitError = checkTransferAllowed(form.amountSen, account);
    if (limitError) errors.amountSen = limitError;
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
