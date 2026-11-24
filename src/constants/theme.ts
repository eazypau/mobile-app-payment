/**
 * Design tokens. Every color, spacing and radius in the app comes from here,
 * so screens never hard-code style values.
 */

export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F4F4F5',
    border: '#E4E4E7',
    text: '#09090B',
    textMuted: '#71717A',
    primary: '#6D28D9',
    primarySoft: '#EDE9FE',
    onPrimary: '#FFFFFF',
    success: '#16A34A',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
  },
  dark: {
    background: '#09090B',
    surface: '#18181B',
    border: '#27272A',
    text: '#FAFAFA',
    textMuted: '#A1A1AA',
    primary: '#7C3AED',
    primarySoft: '#2E1065',
    onPrimary: '#FFFFFF',
    success: '#22C55E',
    danger: '#EF4444',
    dangerSoft: '#450A0A',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ColorName = keyof ThemeColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;
