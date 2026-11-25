import { ApiRequestError } from '@/services/api-error';
import type { Recipient } from '@/services/types';

import { getTransferRecovery, isSameTransfer } from './transfer';

const aisyah: Recipient = { id: 'r1', name: 'Aisyah Ahmad', bankName: 'Maybank', accountNumber: '114402394821' };
const tan: Recipient = { id: 'r2', name: 'Tan Wei Ming', bankName: 'CIMB Bank', accountNumber: '8001234567' };
const base = { recipient: aisyah, amountSen: 5000, note: 'Dinner' };

describe('isSameTransfer', () => {
  it('is true for identical fields', () => {
    expect(isSameTransfer(base, { ...base })).toBe(true);
  });

  it('ignores whitespace around the note', () => {
    expect(isSameTransfer(base, { ...base, note: '  Dinner ' })).toBe(true);
  });

  it('is false when anything that matters changes', () => {
    expect(isSameTransfer(base, { ...base, recipient: tan })).toBe(false);
    expect(isSameTransfer(base, { ...base, amountSen: 5001 })).toBe(false);
    expect(isSameTransfer(base, { ...base, note: 'Lunch' })).toBe(false);
  });
});

describe('getTransferRecovery', () => {
  it('offers retry when the outcome is unknown', () => {
    expect(getTransferRecovery(new ApiRequestError('NETWORK'))).toBe('retry');
    expect(getTransferRecovery(new ApiRequestError('TIMEOUT'))).toBe('retry');
  });

  it('offers edit when the bank refused', () => {
    expect(getTransferRecovery(new ApiRequestError('INSUFFICIENT_FUNDS'))).toBe('edit');
    expect(getTransferRecovery(new ApiRequestError('DAILY_LIMIT_EXCEEDED'))).toBe('edit');
  });
});
