import type { Recipient, Transaction } from '@/services/types';

import { buildHistoryRows, formatDayLabel, getRecentRecipients } from './transactions';

// Local-time dates, so the tests pass in any time zone.
const now = new Date(2026, 10, 25, 21, 0); // 25 Nov 2026, 9 pm

const aisyah: Recipient = { id: 'r1', name: 'Aisyah Ahmad', bankName: 'Maybank', accountNumber: '114402394821' };
const tan: Recipient = { id: 'r2', name: 'Tan Wei Ming', bankName: 'CIMB Bank', accountNumber: '8001234567' };

function tx(id: string, date: Date, recipient: Recipient | null = aisyah): Transaction {
  return {
    id,
    reference: id,
    direction: recipient ? 'out' : 'in',
    counterpartyName: recipient?.name ?? 'Salary',
    recipient,
    amountSen: 1000,
    note: '',
    createdAt: date.toISOString(),
  };
}

describe('formatDayLabel', () => {
  it('says Today and Yesterday', () => {
    expect(formatDayLabel(new Date(2026, 10, 25, 8), now)).toBe('Today');
    expect(formatDayLabel(new Date(2026, 10, 24, 23, 59), now)).toBe('Yesterday');
  });

  it('uses a short date earlier this year, and adds the year otherwise', () => {
    expect(formatDayLabel(new Date(2026, 10, 12), now)).toMatch(/12.*Nov/);
    expect(formatDayLabel(new Date(2026, 10, 12), now)).not.toMatch(/2026/);
    expect(formatDayLabel(new Date(2025, 10, 12), now)).toMatch(/2025/);
  });
});

describe('buildHistoryRows', () => {
  it('puts a header before each new day and reports where the headers are', () => {
    const { rows, stickyHeaderIndices } = buildHistoryRows(
      [
        tx('a', new Date(2026, 10, 25, 20)),
        tx('b', new Date(2026, 10, 25, 9)),
        tx('c', new Date(2026, 10, 24, 18)),
      ],
      now,
    );

    expect(rows.map((row) => (row.type === 'header' ? row.title : row.key))).toEqual([
      'Today',
      'a',
      'b',
      'Yesterday',
      'c',
    ]);
    expect(stickyHeaderIndices).toEqual([0, 3]);
  });

  it('returns nothing for no transactions', () => {
    expect(buildHistoryRows([], now)).toEqual({ rows: [], stickyHeaderIndices: [] });
  });
});

describe('getRecentRecipients', () => {
  it('returns distinct recipients, newest first, skipping incoming money', () => {
    const list = [
      tx('1', now, aisyah),
      tx('2', now, null),
      tx('3', now, aisyah),
      tx('4', now, tan),
    ];
    expect(getRecentRecipients(list, 5).map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('stops at the maximum', () => {
    expect(getRecentRecipients([tx('1', now, aisyah), tx('2', now, tan)], 1).map((r) => r.id)).toEqual(['r1']);
  });
});
