import type { Account, Recipient } from '@/services/types';

import {
  checkTransferAllowed,
  getRemainingDailyLimit,
  hasErrors,
  validateTransfer,
  type TransferForm,
  NOTE_MAX_LENGTH,
} from './validation';

const account: Account = {
  balanceSen: 1_248_050, // RM 12,480.50
  dailyLimitSen: 1_000_000, // RM 10,000.00
  spentTodaySen: 250_000, // RM 2,500.00 → RM 7,500.00 left today
};

const recipient: Recipient = { id: 'r1', name: 'Aisyah Ahmad', bankName: 'Maybank', accountNumber: '114402394821' };

const validForm: TransferForm = { recipient, amountSen: 5000, note: 'Dinner' };

describe('getRemainingDailyLimit', () => {
  it('subtracts what was already spent today', () => {
    expect(getRemainingDailyLimit(account)).toBe(750_000);
  });

  it('never goes below zero', () => {
    expect(getRemainingDailyLimit({ ...account, spentTodaySen: 2_000_000 })).toBe(0);
  });
});

describe('checkTransferAllowed', () => {
  it('allows an amount within balance and limit', () => {
    expect(checkTransferAllowed(5000, account)).toBeNull();
  });

  it('allows exactly the remaining daily limit', () => {
    expect(checkTransferAllowed(750_000, account)).toBeNull();
  });

  it('rejects one sen over the remaining daily limit', () => {
    expect(checkTransferAllowed(750_001, account)).toBe(
      'This is over your daily limit. You can send up to RM 7,500.00 more today',
    );
  });

  it('reports the balance first when both are exceeded', () => {
    expect(checkTransferAllowed(1_300_000, account)).toBe(
      'This is more than your available balance of RM 12,480.50',
    );
  });
});

describe('validateTransfer', () => {
  it('returns no errors for a valid form', () => {
    expect(validateTransfer(validForm, account)).toEqual({});
    expect(hasErrors(validateTransfer(validForm, account))).toBe(false);
  });

  it('requires a recipient', () => {
    expect(validateTransfer({ ...validForm, recipient: null }, account)).toEqual({
      recipient: 'Choose who to send to',
    });
  });

  it('asks for an amount when it is zero, not for the minimum', () => {
    expect(validateTransfer({ ...validForm, amountSen: 0 }, account).amountSen).toBe('Enter an amount');
  });

  it('enforces the RM 1.00 minimum', () => {
    expect(validateTransfer({ ...validForm, amountSen: 99 }, account).amountSen).toBe(
      'The minimum transfer is RM 1.00',
    );
    expect(validateTransfer({ ...validForm, amountSen: 100 }, account)).toEqual({});
  });

  it('includes limit errors for the amount', () => {
    expect(validateTransfer({ ...validForm, amountSen: 800_000 }, account).amountSen).toMatch(/daily limit/);
  });

  it('allows an empty or whitespace-only note (the note is optional)', () => {
    expect(validateTransfer({ ...validForm, note: '' }, account)).toEqual({});
    expect(validateTransfer({ ...validForm, note: '   ' }, account)).toEqual({});
  });

  it('measures note length after trimming', () => {
    const padded = `  ${'a'.repeat(NOTE_MAX_LENGTH)}  `;
    expect(validateTransfer({ ...validForm, note: padded }, account)).toEqual({});
    expect(validateTransfer({ ...validForm, note: 'a'.repeat(NOTE_MAX_LENGTH + 1) }, account).note).toMatch(
      new RegExp(`under ${NOTE_MAX_LENGTH}`),
    );
  });

  it('reports every invalid field at once', () => {
    const errors = validateTransfer({ recipient: null, amountSen: 0, note: '' }, account);
    expect(Object.keys(errors).sort()).toEqual(['amountSen', 'recipient']);
  });
});
