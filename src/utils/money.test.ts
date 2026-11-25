import { formatSen, formatSenPlain, formatSignedSen, MAX_INPUT_SEN, parseAmountInput } from './money';

describe('formatSen', () => {
  it('formats sen as ringgit with the currency symbol', () => {
    expect(formatSen(1248050)).toBe('RM 12,480.50');
  });

  it('always shows two decimal places', () => {
    expect(formatSen(5000)).toBe('RM 50.00');
    expect(formatSen(5)).toBe('RM 0.05');
    expect(formatSen(0)).toBe('RM 0.00');
  });
});

describe('formatSenPlain', () => {
  it('formats without the currency symbol', () => {
    expect(formatSenPlain(1248050)).toBe('12,480.50');
    expect(formatSenPlain(0)).toBe('0.00');
  });
});

describe('parseAmountInput (cash-register behaviour)', () => {
  it('shifts a typed digit in from the right', () => {
    // Display was "50.00" (5000 sen), user typed "5".
    expect(parseAmountInput('50.005', 5000)).toBe(50005);
  });

  it('shifts digits out on backspace', () => {
    // Display was "50.00", user pressed backspace.
    expect(parseAmountInput('50.0', 5000)).toBe(500);
  });

  it('builds an amount from zero', () => {
    expect(parseAmountInput('0.001', 0)).toBe(1);
    expect(parseAmountInput('0.012', 1)).toBe(12);
    expect(parseAmountInput('0.125', 12)).toBe(125);
  });

  it('ignores thousands separators', () => {
    expect(parseAmountInput('1,234.567', 123456)).toBe(1234567);
  });

  it('returns 0 when everything is deleted', () => {
    expect(parseAmountInput('', 5)).toBe(0);
    expect(parseAmountInput('.', 5)).toBe(0);
  });

  it('keeps the previous amount when typing past the maximum', () => {
    expect(parseAmountInput(`${formatSenPlain(MAX_INPUT_SEN)}1`, MAX_INPUT_SEN)).toBe(MAX_INPUT_SEN);
  });
});

describe('formatSignedSen', () => {
  it('marks money out with minus and money in with plus', () => {
    expect(formatSignedSen(5000, 'out')).toBe('-RM 50.00');
    expect(formatSignedSen(480000, 'in')).toBe('+RM 4,800.00');
  });
});
