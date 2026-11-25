import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { FieldError } from '@/components/field-error';
import { TransactionRow } from '@/components/transaction-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTransactions } from '@/hooks/queries';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/services/api-error';
import type { Transaction } from '@/services/types';
import { useTransferStore } from '@/store/transfer-store';
import { buildHistoryRows } from '@/utils/transactions';

export default function HistoryScreen() {
  const colors = useTheme();
  const headerHeight = useHeaderHeight();
  const history = useTransactions();
  const startResend = useTransferStore((state) => state.startResend);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const transactions = history.data?.pages.flatMap((page) => page.items) ?? [];
  const { rows, stickyHeaderIndices } = buildHistoryRows(transactions, new Date());

  function resend(transaction: Transaction) {
    if (!transaction.recipient) return;
    startResend(transaction.recipient, transaction.amountSen);
    router.push('/transfer/send');
  }

  function loadMore() {
    // onEndReached can fire repeatedly; only ask for a page when one is due.
    if (history.hasNextPage && !history.isFetchingNextPage && !history.isFetchNextPageError) {
      history.fetchNextPage();
    }
  }

  async function handlePullRefresh() {
    setIsPullRefreshing(true);
    await history.refetch();
    setIsPullRefreshing(false);
  }

  function renderFooter() {
    if (history.isFetchingNextPage) return <ActivityIndicator style={styles.footer} color={colors.textMuted} />;
    if (history.isFetchNextPageError) {
      return (
        <View style={styles.footer}>
          <FieldError message={getErrorMessage(history.error)} />
          <Button title="Try again" variant="secondary" onPress={() => history.fetchNextPage()} />
        </View>
      );
    }
    if (!history.hasNextPage && transactions.length > 0) {
      return (
        <AppText variant="caption" color="textMuted" style={styles.end}>
          That&apos;s everything
        </AppText>
      );
    }
    return null;
  }

  if (history.isPending) {
    return (
      <Screen>
        <ActivityIndicator style={styles.footer} color={colors.textMuted} />
      </Screen>
    );
  }

  if (history.isError && transactions.length === 0) {
    return (
      <Screen>
        <View style={styles.footer}>
          <FieldError message={getErrorMessage(history.error)} />
          <Button title="Try again" variant="secondary" onPress={() => history.refetch()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlashList
        data={rows}
        keyExtractor={(row) => row.key}
        // Headers and transactions have different layouts; typing them lets FlashList
        // recycle a header view only into another header, never into a transaction row.
        getItemType={(row) => row.type}
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <View style={[styles.header, { backgroundColor: colors.background }]}>
              <AppText variant="label" color="textMuted">
                {item.title}
              </AppText>
            </View>
          ) : (
            <TransactionRow transaction={item.transaction} onResend={resend} />
          )
        }
        stickyHeaderIndices={stickyHeaderIndices}
        // Pin headers below the transparent iOS 26+ header, not underneath it.
        stickyHeaderConfig={{ offset: headerHeight }}
        contentInsetAdjustmentBehavior="automatic"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter()}
        refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  footer: {
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  end: {
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
});
