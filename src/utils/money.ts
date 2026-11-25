/**
 * Money helpers. All amounts are integers in sen (1 RM = 100 sen), so we
 * never do arithmetic on floats like 0.1 + 0.2. Conversion to ringgit
 * happens only here, at the display edge.
 */

export const SEN_PER_RINGGIT = 100;

/** Largest amount the input accepts: RM 9,999,999.99 (9 digits). */
export const MAX_INPUT_SEN = 999_999_999;

// We format the number with Intl but add the "RM" prefix ourselves. Intl's
// `style: 'currency'` output depends on the ICU data in each JS engine
// (e.g. a normal vs non-breaking space), and Hermes on a phone may differ
// from Node in tests.
const plainFormatter = new Intl.NumberFormat('en-MY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1248050 → "RM 12,480.50" */
export function formatSen(sen: number): string {
  return `RM ${formatSenPlain(sen)}`;
}

/** 1248050 → "12,480.50" (no currency symbol, used inside the amount input) */
export function formatSenPlain(sen: number): string {
  return plainFormatter.format(sen / SEN_PER_RINGGIT);
}

/**
 * Turns whatever is in the cash-register amount input into sen.
 *
 * The input always shows a formatted amount like "50.00". Its digits, read
 * as one integer, are already the amount in sen, so typing "5" after it
 * ("50.005") gives 50005 sen (RM 500.05), and backspace ("50.0") gives
 * 500 sen (RM 5.00). Typing past the maximum keeps the previous amount.
 */
export function parseAmountInput(text: string, previousSen: number): number {
  const digits = text.replace(/\D/g, ''); // replace non-numerics into empty string
  if (digits === '') return 0;

  const sen = Number(digits);
  return sen > MAX_INPUT_SEN ? previousSen : sen;
}

/** For history rows: money out is "-RM 50.00", money in is "+RM 50.00". */
export function formatSignedSen(sen: number, direction: 'in' | 'out'): string {
  return `${direction === 'in' ? '+' : '-'}${formatSen(sen)}`;
}
