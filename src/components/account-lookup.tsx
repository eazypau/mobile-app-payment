import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FieldError } from '@/components/field-error';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BANKS } from '@/constants/banks';
import { Radius, Spacing } from '@/constants/theme';
import { useAccountLookup } from '@/hooks/queries';
import { useTheme } from '@/hooks/use-theme';
import { isApiErrorCode, getErrorMessage } from '@/services/api-error';

import type { Recipient } from '@/services/types';
import { isAccountNumberFormat, maskAccountNumber } from '@/utils/recipient';

const LOOKUP_DEBOUNCE_MS = 500;

type AccountLookupProps = {
  /** The digits typed into the picker's search box. */
  accountNumber: string;
  onSelect: (recipient: Recipient) => void;
};

/**
 * Turns a typed account number into a confirmed recipient: pick the bank,
 * the holder's name is looked up automatically, then the user confirms.
 */
export function AccountLookup({ accountNumber, onSelect }: AccountLookupProps) {
  const colors = useTheme();
  const [bankId, setBankId] = useState<string | null>(null);

  // Debounce: only look up once typing has paused.
  const [settledNumber, setSettledNumber] = useState(accountNumber);
  useEffect(() => {
    const timer = setTimeout(() => setSettledNumber(accountNumber), LOOKUP_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [accountNumber]);

  const lookup = useAccountLookup(bankId, settledNumber);

  // While the user is still typing, any result on screen would be for an older
  // number. Never show a name that doesn't match what's in the box.
  const isSettled = settledNumber === accountNumber;

  function renderStatus() {
    if (bankId === null) {
      return <Hint text="Choose the recipient's bank" />;
    }
    if (!isAccountNumberFormat(accountNumber)) {
      return <Hint text="Account numbers have 10 to 16 digits" />;
    }
    if (!isSettled || lookup.isPending) {
      return (
        <View style={styles.row}>
          <ActivityIndicator color={colors.textMuted} />
          <AppText color="textMuted">Looking up account…</AppText>
        </View>
      );
    }
    if (lookup.isError) {
      return (
        <View style={styles.status}>
          <FieldError message={getErrorMessage(lookup.error)} />
          {isApiErrorCode(lookup.error, 'NETWORK') && (
            <Button title="Try again" variant="secondary" onPress={() => lookup.refetch()} loading={lookup.isFetching} />
          )}
        </View>
      );
    }
    return (
      <Card>
        <View style={styles.row}>
          <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified' }} size={20} tintColor={colors.success} />
          <AppText variant="label">{lookup.data.name}</AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          {lookup.data.bankName} {maskAccountNumber(lookup.data.accountNumber)}
        </AppText>
        <AppText variant="caption" color="textMuted">
          Check this is the person you mean to pay.
        </AppText>
        <Button title="Send to this account" onPress={() => onSelect(lookup.data)} />
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {BANKS.map((bank) => {
          const isSelected = bank.id === bankId;
          return (
            <Pressable
              key={bank.id}
              onPress={() => setBankId(bank.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? colors.primary : colors.surface },
              ]}>
              <AppText variant="caption" color={isSelected ? 'onPrimary' : 'text'}>
                {bank.name}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      {renderStatus()}
    </View>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <AppText variant="caption" color="textMuted">
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  chips: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  status: {
    gap: Spacing.sm,
  },
});
