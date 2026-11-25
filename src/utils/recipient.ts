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
