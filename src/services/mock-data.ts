import type { Recipient } from './types';

/**
 * Seed data for the mock backend. Slice 3a moves this behind async
 * mock API functions; for now the UI imports it directly.
 */

export const MOCK_BALANCE_SEN = 1_248_050; // RM 12,480.50

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
