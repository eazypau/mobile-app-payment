import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AmountInput } from '@/components/amount-input';
import { RecipientPicker } from '@/components/recipient-picker';
import { RecipientRow } from '@/components/recipient-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_BALANCE_SEN, MOCK_RECIPIENTS } from '@/services/mock-data';
import type { Recipient } from '@/services/types';
import { formatSen } from '@/utils/money';

const NOTE_MAX_LENGTH = 140;

export default function SendScreen() {
  const colors = useTheme();
  const headerHeight = useHeaderHeight();

  // Form state stays local while typing; it's written to the store only on "Review" (slice 3).
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amountSen, setAmountSen] = useState(0);
  const [note, setNote] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Proper validation and error messages arrive in slice 2.
  const canReview = recipient !== null && amountSen > 0;

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
            <View style={[styles.box, { backgroundColor: colors.surface }]}>
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
          </View>

          <View style={styles.field}>
            <AppText variant="label">Amount</AppText>
            <AmountInput valueSen={amountSen} onChangeSen={setAmountSen} />
            <AppText variant="caption" color="textMuted">
              Available {formatSen(MOCK_BALANCE_SEN)}
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
              style={[styles.box, styles.note, { backgroundColor: colors.surface, color: colors.text }]}
            />
            <AppText variant="caption" color="textMuted" style={styles.counter}>
              {note.length}/{NOTE_MAX_LENGTH}
            </AppText>
          </View>
        </ScrollView>

        <Button title="Review" onPress={() => {}} disabled={!canReview} />
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
