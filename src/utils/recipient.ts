import type { Recipient } from '@/services/types';

/** "114402394821" → "••••4821". Never show a full account number in lists. */
export function maskAccountNumber(accountNumber: string): string {
  return `••••${accountNumber.slice(-4)}`;
}

/** "Aisyah Ahmad" → "AA", "Priya" → "P" */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** Case-insensitive match on name, bank, or account number. */
export function filterRecipients(recipients: Recipient[], query: string): Recipient[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return recipients;

  return recipients.filter(
    (recipient) =>
      recipient.name.toLowerCase().includes(needle) ||
      recipient.bankName.toLowerCase().includes(needle) ||
      recipient.accountNumber.includes(needle),
  );
}

/** True when the search text is only digits, i.e. the user is typing an account number. */
export function looksLikeAccountNumber(text: string): boolean {
  return /^\d+$/.test(text.trim());
}

/** Malaysian account numbers are roughly 10–16 digits depending on the bank (a heuristic, not per-bank rules). */
export function isAccountNumberFormat(text: string): boolean {
  return /^\d{10,16}$/.test(text.trim());
}
