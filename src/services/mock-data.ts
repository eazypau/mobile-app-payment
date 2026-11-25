import type { Account, Recipient } from './types';

/**
 * Seed data for the mock backend. Slice 3a moves this behind async
 * mock API functions; for now the UI imports it directly.
 */

// RM 2,500 already spent today leaves RM 7,500 of the daily limit, which is
// less than the balance. So RM 8,000 hits the daily limit, and RM 13,000
// hits the balance: both errors can be demoed.
export const MOCK_ACCOUNT: Account = {
  balanceSen: 1_248_050, // RM 12,480.50
  dailyLimitSen: 1_000_000, // RM 10,000.00
  spentTodaySen: 250_000, // RM 2,500.00
};

export const MOCK_RECIPIENTS: Recipient[] = [
  { id: 'r1', name: 'Aisyah Ahmad', bankName: 'Maybank', accountNumber: '114402394821' },
  { id: 'r2', name: 'Tan Wei Ming', bankName: 'CIMB Bank', accountNumber: '8001234567' },
  { id: 'r3', name: 'Priya Raman', bankName: 'Public Bank', accountNumber: '3198765432' },
  { id: 'r4', name: 'Muhammad Hafiz', bankName: 'RHB Bank', accountNumber: '21245600987' },
  { id: 'r5', name: 'Lim Mei Ling', bankName: 'Hong Leong Bank', accountNumber: '04850123456' },
  { id: 'r6', name: 'Nurul Izzah', bankName: 'Bank Islam', accountNumber: '12029010234567' },
  { id: 'r7', name: 'Rajesh Kumar', bankName: 'AmBank', accountNumber: '8881023456789' },
  { id: 'r8', name: 'Chong Kah Hoe', bankName: 'Maybank', accountNumber: '162011558890' },
];
