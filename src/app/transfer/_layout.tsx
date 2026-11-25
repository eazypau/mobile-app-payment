import { Stack } from 'expo-router';

import { HeaderCloseButton } from '@/components/header-close-button';

/**
 * The transfer flow (Send → Review → Success) has its own Stack and is
 * presented as one modal by the root layout. Closing the modal discards
 * the whole flow, so there's no "back" from Success into Review.
 */
export default function TransferLayout() {
  return (
    <Stack>
      <Stack.Screen name="send" options={{ title: 'Send money', headerLeft: () => <HeaderCloseButton /> }} />
    </Stack>
  );
}
