import * as Haptics from 'expo-haptics';
import { Redirect, router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';

import { DetailRow } from '@/components/detail-row';
import { FieldError } from '@/components/field-error';
import { PinSheet } from '@/components/pin-sheet';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useSendTransfer } from '@/hooks/queries';
import { getErrorMessage, isApiErrorCode } from '@/services/api-error';
import { authorizeTransfer } from '@/services/auth';
import type { TransferRequest } from '@/services/types';
import { useTransferStore } from '@/store/transfer-store';
import { getPinNotice } from '@/utils/biometrics';
import { formatSen } from '@/utils/money';
import { maskAccountNumber } from '@/utils/recipient';
import { getTransferRecovery } from '@/utils/transfer';

export default function ReviewScreen() {
  const draft = useTransferStore((state) => state.draft);

  // Opened without a draft (e.g. a deep link): there's nothing to review.
  if (!draft) return <Redirect href="/" />;

  return <ReviewContent draft={draft} />;
}

function ReviewContent({ draft }: { draft: TransferRequest }) {
  const setReceipt = useTransferStore((state) => state.setReceipt);
  const sendTransfer = useSendTransfer();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // null = PIN sheet closed; otherwise it's open, with an optional notice explaining why.
  const [pinSheet, setPinSheet] = useState<{ notice: string | null } | null>(null);
  // iOS doesn't always show our "Use PIN" button in its Face ID dialog, so once biometrics
  // are cancelled or fail, offer the app PIN on our own screen too. No dead ends.
  const [showPinOption, setShowPinOption] = useState(false);

  const isBusy = isAuthorizing || sendTransfer.isPending;
  const recovery = sendTransfer.isError ? getTransferRecovery(sendTransfer.error) : null;

  // While money is moving, the Android back button must not leave this screen.
  useEffect(() => {
    if (!isBusy) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isBusy]);

  function send() {
    sendTransfer.mutate(draft, {
      onSuccess: (receipt) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setReceipt(receipt);
        // Replace, so there's no "back" from Success into this screen.
        router.replace('/transfer/success');
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
  }

  async function handleConfirm() {
    setAuthError(null);
    setIsAuthorizing(true);
    const result = await authorizeTransfer(`Send ${formatSen(draft.amountSen)} to ${draft.recipient.name}`);
    setIsAuthorizing(false);

    switch (result.status) {
      case 'authorized':
        send();
        break;
      case 'cancelled':
        // The user backed out on purpose: no error, just stay here (with the PIN as an option).
        setShowPinOption(true);
        break;
      case 'needs_pin':
        setPinSheet({ notice: getPinNotice(result.reason) });
        break;
      case 'failed':
        setAuthError("We couldn't confirm it's you. Try again, or use your app PIN.");
        setShowPinOption(true);
        break;
    }
  }

  function handlePinVerified() {
    setPinSheet(null);
    send();
  }

  return (
    <Screen>
      {/* Lock the back button and swipe-back gesture while the transfer is in flight. */}
      <Stack.Screen options={{ headerBackVisible: !isBusy, gestureEnabled: !isBusy }} />

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.amount}>
          <AppText variant="caption" color="textMuted">
            You&apos;re sending
          </AppText>
          <AppText variant="title">{formatSen(draft.amountSen)}</AppText>
        </View>

        <Card>
          <DetailRow label="To">
            <AppText variant="label">{draft.recipient.name}</AppText>
            <AppText variant="caption" color="textMuted">
              {draft.recipient.bankName} {maskAccountNumber(draft.recipient.accountNumber)}
            </AppText>
          </DetailRow>
          {draft.note !== '' && (
            <DetailRow label="Note">
              <AppText>{draft.note}</AppText>
            </DetailRow>
          )}
          <DetailRow label="Fee">
            <AppText>{formatSen(0)}</AppText>
          </DetailRow>
        </Card>

        {authError && <FieldError message={authError} />}

        {sendTransfer.isError && (
          <View style={styles.error}>
            <FieldError message={getErrorMessage(sendTransfer.error)} />
            {isApiErrorCode(sendTransfer.error, 'NETWORK') && (
              <AppText variant="caption" color="textMuted">
                Your money hasn&apos;t moved.
              </AppText>
            )}
          </View>
        )}
      </ScrollView>

      {recovery === 'edit' ? (
        <Button title="Edit transfer" onPress={() => router.back()} />
      ) : recovery === 'retry' ? (
        // Same draft, same idempotency key: if the first attempt did go through, the server returns it instead of paying twice.
        <Button title="Try again" onPress={send} loading={isBusy} />
      ) : (
        <>
          <Button title="Confirm and send" onPress={handleConfirm} loading={isBusy} />
          {showPinOption && !isBusy && (
            <Button title="Use app PIN instead" variant="ghost" onPress={() => setPinSheet({ notice: null })} />
          )}
        </>
      )}

      <PinSheet
        visible={pinSheet !== null}
        notice={pinSheet?.notice ?? null}
        onVerified={handlePinVerified}
        onClose={() => setPinSheet(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  amount: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  error: {
    gap: Spacing.xs,
  },
});
