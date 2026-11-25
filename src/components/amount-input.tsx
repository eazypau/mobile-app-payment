import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSenPlain, parseAmountInput } from '@/utils/money';

type AmountInputProps = {
  valueSen: number;
  onChangeSen: (sen: number) => void;
};

/**
 * Cash-register style amount input: digits fill in from the right, so
 * typing 5, 0, 0, 0 shows 50.00. All parsing lives in `parseAmountInput`.
 */
export function AmountInput({ valueSen, onChangeSen }: AmountInputProps) {
  const colors = useTheme();
  const text = formatSenPlain(valueSen);

  return (
    <View style={styles.row}>
      <AppText variant="heading" color="textMuted">
        RM
      </AppText>
      <TextInput
        value={text}
        onChangeText={(next) => onChangeSen(parseAmountInput(next, valueSen))}
        keyboardType="number-pad"
        // Keep the cursor at the end so new digits always shift in from the right.
        selection={{ start: text.length, end: text.length }}
        // Hide copy/paste: pasting "50" would mean 50 sen, which surprises people.
        contextMenuHidden
        accessibilityLabel="Amount in ringgit"
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    paddingVertical: Spacing.sm,
  },
});
