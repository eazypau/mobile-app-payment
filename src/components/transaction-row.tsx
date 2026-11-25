import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Transaction } from '@/services/types';
import { formatTime } from '@/utils/date';
import { formatSignedSen } from '@/utils/money';
import { getInitials } from '@/utils/recipient';
import { formatDayLabel } from '@/utils/transactions';

type TransactionRowProps = {
  transaction: Transaction;
  /** Only outgoing transfers can be re-sent, so only those get a handler. */
  onResend?: (transaction: Transaction) => void;
  /** Show the day too ("Today, 3:26 pm"), for lists without day headers (Home). History shows only the time. */
  showDate?: boolean;
};

/**
 * One history line. Rendered inside FlashList, which *recycles* row views for
 * new data, so this must be a pure function of its props: no local state,
 * or it would leak from one transaction into another while scrolling.
 */
export function TransactionRow({ transaction, onResend, showDate = false }: TransactionRowProps) {
  const colors = useTheme();
  const isIncoming = transaction.direction === 'in';
  const canResend = !isIncoming && transaction.recipient !== null && onResend !== undefined;
  const time = formatTime(transaction.createdAt);
  const when = showDate ? `${formatDayLabel(new Date(transaction.createdAt), new Date())}, ${time}` : time;
  const subtitle = [transaction.note, when].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={canResend ? () => onResend(transaction) : undefined}
      disabled={!canResend}
      accessibilityRole={canResend ? 'button' : undefined}
      accessibilityHint={canResend ? 'Send this amount to them again' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: isIncoming ? colors.surface : colors.primarySoft }]}>
        <AppText variant="label" color={isIncoming ? 'success' : 'primary'}>
          {getInitials(transaction.counterpartyName)}
        </AppText>
      </View>
      <View style={styles.text}>
        <AppText numberOfLines={1}>{transaction.counterpartyName}</AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <AppText variant="label" color={isIncoming ? 'success' : 'text'} style={styles.amount}>
        {formatSignedSen(transaction.amountSen, transaction.direction)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
});
