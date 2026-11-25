import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** ✕ in the header of the first screen of the transfer modal. Closing it discards the whole flow. */
export function HeaderCloseButton() {
  const colors = useTheme();

  return (
    <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cancel transfer" hitSlop={12}>
      <SymbolView name={{ ios: 'xmark', android: 'close' }} size={22} tintColor={colors.text} />
    </Pressable>
  );
}
