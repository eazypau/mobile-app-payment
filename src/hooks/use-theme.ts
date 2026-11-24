import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';

/** Returns the color tokens for the current system light/dark setting. */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
