import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ColorName } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = keyof typeof styles;

type AppTextProps = TextProps & {
  variant?: Variant;
  color?: ColorName;
};

export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const colors = useTheme();

  return <Text style={[styles[variant], { color: colors[color] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
});
