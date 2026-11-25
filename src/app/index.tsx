import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { FieldError } from '@/components/field-error';
import { TransactionRow } from '@/components/transaction-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Spacing } from '@/constants/theme';
import { useAccount, useTransactions } from '@/hooks/queries';
import { getErrorMessage } from '@/services/api-error';
import type { Transaction } from '@/services/types';
import { useTransferStore } from '@/store/transfer-store';
import { formatSen } from '@/utils/money';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const account = useAccount();
  const history = useTransactions();
  const resetTransfer = useTransferStore((state) => state.reset);
  const startResend = useTransferStore((state) => state.startResend);

  // Only show the pull-to-refresh spinner for a pull, not for background refetches.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const recent = history.data?.pages[0]?.items.slice(0, RECENT_COUNT) ?? [];

  function startTransfer() {
    // A new flow: forget any previous draft (and its idempotency key), receipt and prefill.
    resetTransfer();
    router.push('/transfer/send');
  }

  function resend(transaction: Transaction) {
    if (!transaction.recipient) return;
    startResend(transaction.recipient, transaction.amountSen);
    router.push('/transfer/send');
  }

  async function handlePullRefresh() {
    setIsPullRefreshing(true);
    await Promise.all([account.refetch(), history.refetch()]);
    setIsPullRefreshing(false);
  }

  function renderRecent() {
    if (history.isPending) {
      return (
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={40} />
          <Skeleton width="100%" height={40} />
          <Skeleton width="100%" height={40} />
        </View>
      );
    }
    if (history.isError && recent.length === 0) {
      return (
        <>
          <FieldError message={getErrorMessage(history.error)} />
          <Button title="Try again" variant="secondary" onPress={() => history.refetch()} loading={history.isFetching} />
        </>
      );
    }
    if (recent.length === 0) {
      return (
        <AppText variant="caption" color="textMuted">
          No transfers yet.
        </AppText>
      );
    }
    return recent.map((transaction) => (
      <TransactionRow key={transaction.id} transaction={transaction} onResend={resend} showDate />
    ));
  }

  return (
    <Screen>
      <ScrollView
        // iOS 26+ draws a transparent "Liquid Glass" header over the screen. This lets iOS
        // inset the content below it, while still scrolling underneath the glass.
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}>
        <Card>
          <AppText variant="caption" color="textMuted">
            Available balance
          </AppText>

          {account.data ? (
            <AppText variant="title">{formatSen(account.data.balanceSen)}</AppText>
          ) : account.isError ? (
            <>
              <FieldError message={getErrorMessage(account.error)} />
              <Button
                title="Try again"
                variant="secondary"
                onPress={() => account.refetch()}
                loading={account.isFetching}
              />
            </>
          ) : (
            <Skeleton width={200} height={34} />
          )}

          {/* A refresh failed, but we still have the last balance: keep it and say so. */}
          {account.data && account.isError && (
            <AppText variant="caption" color="danger">
              Couldn&apos;t refresh. Showing your last known balance.
            </AppText>
          )}
        </Card>

        <Button title="Send money" onPress={startTransfer} disabled={!account.data} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="heading">Recent</AppText>
            <Pressable onPress={() => router.push('/history')} accessibilityRole="link" hitSlop={12}>
              <AppText variant="label" color="primary">
                See all
              </AppText>
            </Pressable>
          </View>
          {renderRecent()}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletons: {
    gap: Spacing.sm,
  },
});
