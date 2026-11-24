import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = useTheme();

  // Feed our tokens into React Navigation so headers and screen backgrounds match the app.
  const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
      </Stack>
    </ThemeProvider>
  );
}
