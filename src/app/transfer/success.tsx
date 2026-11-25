import { Redirect, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { BackHandler, ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { DetailRow } from '@/components/detail-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TransferReceipt } from '@/services/types';
import { useTransferStore } from '@/store/transfer-store';
import { formatDateTime } from '@/utils/date';
import { formatSen } from '@/utils/money';
import { maskAccountNumber } from '@/utils/recipient';

export default function SuccessScreen() {
  const receipt = useTransferStore((state) => state.receipt);

  // Opened without a receipt (e.g. a deep link): nothing to show.
  if (!receipt) return <Redirect href="/" />;

  return <Receipt receipt={receipt} />;
}

/** Closes the whole transfer modal and goes back to Home. */
function done() {
  router.dismissTo('/');
}

function Receipt({ receipt }: { receipt: TransferReceipt }) {
  const colors = useTheme();

  // Android back on Success means "Done", never "back to Send".
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      done();
      return true;
    });
    return () => subscription.remove();
  }, []);

  function shareReceipt() {
    Share.share({
      message: [
        `Transfer of ${formatSen(receipt.amountSen)} to ${receipt.recipient.name}`,
        `Reference: ${receipt.reference}`,
        `Date: ${formatDateTime(receipt.createdAt)}`,
      ].join('\n'),
    });
  }

  return (
    <Screen>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {/* One-prop layout animation: Reanimated runs it on the UI thread when the view mounts. */}
          <Animated.View entering={ZoomIn.springify()}>
            <SymbolView
              name={{ ios: 'checkmark.circle.fill', android: 'check_circle' }}
              size={72}
              tintColor={colors.success}
            />
          </Animated.View>
          <AppText variant="title">{formatSen(receipt.amountSen)} sent</AppText>
          <AppText color="textMuted">to {receipt.recipient.name}</AppText>
        </View>

        <Card>
          <DetailRow label="Reference">
            <AppText variant="label">{receipt.reference}</AppText>
          </DetailRow>
          <DetailRow label="Date">
            <AppText>{formatDateTime(receipt.createdAt)}</AppText>
          </DetailRow>
          <DetailRow label="To">
            <AppText>{receipt.recipient.name}</AppText>
            <AppText variant="caption" color="textMuted">
              {receipt.recipient.bankName} {maskAccountNumber(receipt.recipient.accountNumber)}
            </AppText>
          </DetailRow>
          {receipt.note !== '' && (
            <DetailRow label="Note">
              <AppText>{receipt.note}</AppText>
            </DetailRow>
          )}
          <DetailRow label="New balance">
            <AppText>{formatSen(receipt.balanceAfterSen)}</AppText>
          </DetailRow>
        </Card>
      </ScrollView>

      <View style={styles.actions}>
        <Button title="Share receipt" variant="secondary" onPress={shareReceipt} />
        <Button title="Done" onPress={done} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  actions: {
    gap: Spacing.sm,
  },
});
