import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, useColorScheme } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Created once, outside any component, so re-renders never throw away the cache.
const queryClient = new QueryClient({
  defaultOptions: {
    // One retry for reads: enough for a blip, without making errors slow to appear.
    queries: { retry: 1 },
  },
});

// There's no browser "window focus" on mobile. Tell TanStack Query the app is
// focused when it returns to the foreground, so stale data (the balance) refetches.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (status) => setFocused(status === 'active'));
  return () => subscription.remove();
});

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          {/* No swipe-down to dismiss: it could close the flow mid-transfer. Use ✕ or Done. */}
          <Stack.Screen name="transfer" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
