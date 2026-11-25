import type { Recipient } from '@/services/types';

import {
  filterRecipients,
  getInitials,
  isAccountNumberFormat,
  looksLikeAccountNumber,
  maskAccountNumber,
} from './recipient';

const recipients: Recipient[] = [
  { id: '1', name: 'Aisyah Ahmad', bankName: 'Maybank', accountNumber: '114402394821' },
  { id: '2', name: 'Tan Wei Ming', bankName: 'CIMB Bank', accountNumber: '8001234567' },
];

describe('maskAccountNumber', () => {
  it('shows only the last four digits', () => {
    expect(maskAccountNumber('114402394821')).toBe('••••4821');
  });
});

describe('getInitials', () => {
  it('uses the first letter of up to two words', () => {
    expect(getInitials('Aisyah Ahmad')).toBe('AA');
    expect(getInitials('Tan Wei Ming')).toBe('TW');
    expect(getInitials('priya')).toBe('P');
  });

  it('ignores extra spaces', () => {
    expect(getInitials('  Lim   Mei ')).toBe('LM');
  });
});

describe('filterRecipients', () => {
  it('returns everyone for an empty query', () => {
    expect(filterRecipients(recipients, '  ')).toEqual(recipients);
  });

  it('matches name and bank case-insensitively', () => {
    expect(filterRecipients(recipients, 'aisyah').map((r) => r.id)).toEqual(['1']);
    expect(filterRecipients(recipients, 'cimb').map((r) => r.id)).toEqual(['2']);
  });

  it('matches part of an account number', () => {
    expect(filterRecipients(recipients, '4821').map((r) => r.id)).toEqual(['1']);
  });

  it('returns nothing when there is no match', () => {
    expect(filterRecipients(recipients, 'zzz')).toEqual([]);
  });
});

describe('looksLikeAccountNumber', () => {
  it('is true for digits only', () => {
    expect(looksLikeAccountNumber('8001')).toBe(true);
    expect(looksLikeAccountNumber(' 8001 ')).toBe(true);
  });

  it('is false for names or mixed text', () => {
    expect(looksLikeAccountNumber('Tan')).toBe(false);
    expect(looksLikeAccountNumber('800-1')).toBe(false);
    expect(looksLikeAccountNumber('')).toBe(false);
  });
});

describe('isAccountNumberFormat', () => {
  it('accepts 10 to 16 digits', () => {
    expect(isAccountNumberFormat('1234567890')).toBe(true);
    expect(isAccountNumberFormat('1234567890123456')).toBe(true);
  });

  it('rejects too short, too long, or non-digits', () => {
    expect(isAccountNumberFormat('123456789')).toBe(false);
    expect(isAccountNumberFormat('12345678901234567')).toBe(false);
    expect(isAccountNumberFormat('12345abcde')).toBe(false);
  });
});
