import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AmountInput } from '@/components/amount-input';
import { FieldError } from '@/components/field-error';
import { RecipientPicker } from '@/components/recipient-picker';
import { RecipientRow } from '@/components/recipient-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAccount } from '@/hooks/queries';
import { useShake } from '@/hooks/use-shake';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/services/api-error';
import type { Account, Recipient } from '@/services/types';
import { useTransferStore } from '@/store/transfer-store';
import { formatSen } from '@/utils/money';
import {
  checkTransferAllowed,
  getRemainingDailyLimit,
  hasErrors,
  NOTE_MAX_LENGTH,
  validateTransfer,
  type FieldErrors,
} from '@/utils/validation';

/**
 * Waits for the account before showing the form. Normally it's already cached
 * from Home, but a deep link can open this screen directly.
 */
export default function SendScreen() {
  const account = useAccount();

  if (account.data) return <SendForm account={account.data} />;

  return (
    <Screen>
      {account.isError ? (
        <>
          <FieldError message={getErrorMessage(account.error)} />
          <Button title="Try again" variant="secondary" onPress={() => account.refetch()} loading={account.isFetching} />
        </>
      ) : (
        <ActivityIndicator />
      )}
    </Screen>
  );
}

function SendForm({ account }: { account: Account }) {
  const colors = useTheme();
  const headerHeight = useHeaderHeight();
  const amountShake = useShake();
  const saveDraft = useTransferStore((state) => state.saveDraft);

  // Form state stays local while typing; it's written to the store only on "Review".
  // When re-sending a past transfer, the form starts from its recipient and amount.
  const prefill = useTransferStore((state) => state.prefill);
  const [recipient, setRecipient] = useState<Recipient | null>(prefill?.recipient ?? null);
  const [amountSen, setAmountSen] = useState(prefill?.amountSen ?? 0);
  const [note, setNote] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hasTriedReview, setHasTriedReview] = useState(false);

  // Errors are derived on every render, never stored, so they can't go stale.
  const errors = validateTransfer({ recipient, amountSen, note }, account);
  const limitError = checkTransferAllowed(amountSen, account);

  // "Reward early, punish late": balance/limit problems show live while typing;
  // "required" errors wait until the user has tried to continue once.
  const visibleErrors: FieldErrors = hasTriedReview ? errors : { amountSen: limitError ?? undefined };

  function handleAmountChange(nextSen: number) {
    const wasAllowed = checkTransferAllowed(amountSen, account) === null;
    const isAllowed = checkTransferAllowed(nextSen, account) === null;

    // Shake once when the amount crosses into "too much", not on every keystroke after.
    if (wasAllowed && !isAllowed) {
      amountShake.shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setAmountSen(nextSen);
  }

  function handleReview() {
    setHasTriedReview(true);

    if (hasErrors(errors)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (errors.amountSen) amountShake.shake();
      return;
    }

    // Validation passed, so the recipient is set.
    if (recipient) {
      saveDraft({ recipient, amountSen, note });
      router.push('/transfer/review');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        // Android is edge-to-edge, so the window no longer resizes for the keyboard: pad on both platforms.
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        style={styles.flex}>
        <ScrollView
          // Inset content below the transparent iOS 26+ header (see Home).
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* maybe I will consider to hide this for the time being, as I felt this modal has too many things and I have never see mobile apps having this selection */}
          {/* <RecentRecipients selectedId={recipient?.id ?? null} onSelect={setRecipient} /> */}

          <View style={styles.field}>
            <AppText variant="label">To</AppText>
            <View
              style={[
                styles.box,
                { backgroundColor: colors.surface, borderColor: visibleErrors.recipient ? colors.danger : 'transparent' },
              ]}>
              {recipient ? (
                <RecipientRow recipient={recipient} onPress={() => setIsPickerOpen(true)} showChevron />
              ) : (
                <Pressable
                  onPress={() => setIsPickerOpen(true)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.choose, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'person.crop.circle.badge.plus', android: 'person_add' }}
                    size={22}
                    tintColor={colors.primary}
                  />
                  <AppText variant="label" color="primary">
                    Choose recipient
                  </AppText>
                </Pressable>
              )}
            </View>
            <FieldError message={visibleErrors.recipient} />
          </View>

          <View style={styles.field}>
            <AppText variant="label">Amount</AppText>
            <Animated.View style={amountShake.style}>
              <AmountInput valueSen={amountSen} onChangeSen={handleAmountChange} hasError={!!visibleErrors.amountSen} />
            </Animated.View>
            <FieldError message={visibleErrors.amountSen} />
            <AppText variant="caption" color="textMuted">
              Available {formatSen(account.balanceSen)} · {formatSen(getRemainingDailyLimit(account))} left today
            </AppText>
          </View>

          <View style={styles.field}>
            <AppText variant="label">Note (optional)</AppText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What's it for?"
              placeholderTextColor={colors.textMuted}
              maxLength={NOTE_MAX_LENGTH}
              multiline
              // Android centers multiline text vertically by default.
              textAlignVertical="top"
              style={[
                styles.box,
                styles.note,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: visibleErrors.note ? colors.danger : 'transparent',
                },
              ]}
            />
            <FieldError message={visibleErrors.note} />
            <AppText variant="caption" color="textMuted" style={styles.counter}>
              {note.length}/{NOTE_MAX_LENGTH}
            </AppText>
          </View>
        </ScrollView>

        <Button title="Review" onPress={handleReview} />
      </KeyboardAvoidingView>

      <RecipientPicker
        visible={isPickerOpen}
        onSelect={(selected) => {
          setRecipient(selected);
          setIsPickerOpen(false);
        }}
        onClose={() => setIsPickerOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  form: {
    gap: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  box: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  choose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  note: {
    minHeight: 88,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    fontSize: 16,
  },
  counter: {
    alignSelf: 'flex-end',
  },
});
