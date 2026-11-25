import type { Recipient, Transaction } from '@/services/types';

/** A flattened history list: date headers mixed in with transaction rows, ready for FlashList. */
export type HistoryRow =
  | { type: 'header'; key: string; title: string }
  | { type: 'transaction'; key: string; transaction: Transaction };

const shortDateFormatter = new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short' });
const longDateFormatter = new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

/** Local calendar day, e.g. "2026-10-25" (months are 0-based in JS). */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** "Today", "Yesterday", "12 Nov", or "12 Nov 2025" for another year. */
export function formatDayLabel(date: Date, now: Date): string {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey(date) === dayKey(now)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  return date.getFullYear() === now.getFullYear() ? shortDateFormatter.format(date) : longDateFormatter.format(date);
}

/**
 * Inserts a header before each new day. Also returns where the headers are,
 * because FlashList's `stickyHeaderIndices` needs their positions.
 */
export function buildHistoryRows(
  transactions: Transaction[],
  now: Date,
): { rows: HistoryRow[]; stickyHeaderIndices: number[] } {
  const rows: HistoryRow[] = [];
  const stickyHeaderIndices: number[] = [];
  let currentDay = '';

  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt);
    const day = dayKey(date);
    if (day !== currentDay) {
      currentDay = day;
      stickyHeaderIndices.push(rows.length);
      rows.push({ type: 'header', key: `header-${day}`, title: formatDayLabel(date, now) });
    }
    rows.push({ type: 'transaction', key: transaction.id, transaction });
  }

  return { rows, stickyHeaderIndices };
}

/** The most recent distinct people the user sent money to, newest first. */
export function getRecentRecipients(transactions: Transaction[], max: number): Recipient[] {
  const recent: Recipient[] = [];
  for (const transaction of transactions) {
    const { recipient } = transaction;
    if (recipient && !recent.some((r) => r.id === recipient.id)) recent.push(recipient);
    if (recent.length === max) break;
  }
  return recent;
}
