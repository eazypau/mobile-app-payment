import { MOCK_RECIPIENTS } from './mock-data';
import type { Transaction } from './types';

/**
 * Generates a believable account history for the mock server: transfers out
 * to saved recipients plus some money coming in, spread over about 6 months.
 * A seeded random generator means every reviewer sees the same list.
 */

const NOTES = ['Dinner', 'Rent share', 'Groceries', 'Movie tickets', 'Birthday gift', 'Petrol', 'Lunch', ''];
const INCOMING = ['Salary · Acme Sdn Bhd', 'Refund · Shopee', 'Transfer from Lim Mei Ling', 'Cashback · Touch n Go'];

/** Tiny deterministic PRNG (mulberry32): same seed, same sequence. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateHistory(count: number, now: Date, seed = 42): Transaction[] {
  const random = createRandom(seed);
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const savedRecipients = MOCK_RECIPIENTS.filter((recipient) => !recipient.id.startsWith('test-'));

  const transactions: Transaction[] = [];
  let time = now.getTime() - 60 * 60 * 1000; // start an hour ago, newest first

  for (let i = 0; i < count; i++) {
    // Step back 1 to 7.5 hours each time: about 1,000 items ≈ 6 months.
    time -= (1 + random() * 6.5) * 60 * 60 * 1000;
    const isIncoming = random() < 0.15;
    const recipient = isIncoming ? null : pick(savedRecipients);

    transactions.push({
      id: `seed-${i}`,
      reference: `TS${String(count - i).padStart(6, '0')}`,
      direction: isIncoming ? 'in' : 'out',
      counterpartyName: recipient ? recipient.name : pick(INCOMING),
      recipient,
      // Whole ringgit up to RM 500 out, up to RM 3,000 in.
      amountSen: (1 + Math.floor(random() * (isIncoming ? 3000 : 500))) * 100,
      note: isIncoming ? '' : pick(NOTES),
      createdAt: new Date(time).toISOString(),
    });
  }

  return transactions;
}
