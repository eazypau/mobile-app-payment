import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { FieldError } from '@/components/field-error';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Spacing } from '@/constants/theme';
import { useAccount } from '@/hooks/queries';
import { getErrorMessage } from '@/services/api-error';
import { formatSen } from '@/utils/money';

export default function HomeScreen() {
  const account = useAccount();

  // Only show the pull-to-refresh spinner for a pull, not for background refetches.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  async function handlePullRefresh() {
    setIsPullRefreshing(true);
    await account.refetch();
    setIsPullRefreshing(false);
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

        <Button title="Send money" onPress={() => router.push('/transfer/send')} disabled={!account.data} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.md,
  },
});
