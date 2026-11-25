import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { mockSettings, resetMockServer } from '@/services/mock-api';

/**
 * Renders the real /transfer/send route (with the real root layout and its
 * providers) to prove the screen actually wires up the validation rules.
 * The rules themselves are unit-tested in utils/validation.test.ts.
 */

beforeEach(() => {
  resetMockServer();
  mockSettings.latencyMs = 0;
});

it('shows required-field errors only after the first Review tap', async () => {
  await renderRouter('src/app', { initialUrl: '/transfer/send' });

  const review = await screen.findByText('Review');
  expect(screen.queryByText('Choose who to send to')).toBeNull();

  await fireEvent.press(review);

  expect(await screen.findByText('Choose who to send to')).toBeTruthy();
  expect(screen.getByText('Enter an amount')).toBeTruthy();
});

it('shows the daily-limit error live, before Review is tapped', async () => {
  await renderRouter('src/app', { initialUrl: '/transfer/send' });

  // The seed account has RM 7,500 left today, so RM 8,000 is over the limit.
  await fireEvent.changeText(await screen.findByDisplayValue('0.00'), '8,000.00');

  expect(await screen.findByText(/over your daily limit/)).toBeTruthy();
  // "Required" errors still wait for the Review tap.
  expect(screen.queryByText('Choose who to send to')).toBeNull();
});
