import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
};

export function Card({ children }: CardProps) {
  const colors = useTheme();

  return <View style={[styles.card, { backgroundColor: colors.surface }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
});
