import * as Haptics from 'expo-haptics';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AmountInput } from '@/components/amount-input';
import { FieldError } from '@/components/field-error';
import { RecipientPicker } from '@/components/recipient-picker';
import { RecipientRow } from '@/components/recipient-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useShake } from '@/hooks/use-shake';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_ACCOUNT, MOCK_RECIPIENTS } from '@/services/mock-data';
import type { Recipient } from '@/services/types';
import { formatSen } from '@/utils/money';
import {
  checkTransferAllowed,
  getRemainingDailyLimit,
  hasErrors,
  NOTE_MAX_LENGTH,
  validateTransfer,
  type FieldErrors,
} from '@/utils/validation';

// Seed data until slice 3a loads the account through the mock API.
const account = MOCK_ACCOUNT;

export default function SendScreen() {
  const colors = useTheme();
  const headerHeight = useHeaderHeight();
  const amountShake = useShake();

  // Form state stays local while typing; it's written to the store only on "Review" (slice 3).
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amountSen, setAmountSen] = useState(0);
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

    // Slice 3b: save the draft to the store and open the Review screen.
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        // Android is edge-to-edge, so the window no longer resizes for the keyboard: pad on both platforms.
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
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
        recipients={MOCK_RECIPIENTS}
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
