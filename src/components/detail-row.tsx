import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

type DetailRowProps = {
  label: string;
  children: ReactNode;
};

/** "Label ........ value" row for the Review summary and the receipt. */
export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="textMuted" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.value}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  label: {
    width: 96,
  },
  value: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
