import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FieldError } from '@/components/field-error';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useVerifyPin } from '@/hooks/queries';
import { useShake } from '@/hooks/use-shake';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage, isApiErrorCode } from '@/services/api-error';

const PIN_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'] as const;

type PinSheetProps = {
  visible: boolean;
  /** Why the PIN is needed (e.g. "Biometrics aren't set up"), or null. */
  notice: string | null;
  onVerified: () => void;
  onClose: () => void;
};

/**
 * Fallback authorization: a 6-digit app PIN on our own keypad, checked by the
 * server. The digits only ever live in this component's state.
 */
export function PinSheet({ visible, notice, onVerified, onClose }: PinSheetProps) {
  const colors = useTheme();
  const verifyPin = useVerifyPin();
  const dotsShake = useShake();
  const [pin, setPin] = useState('');

  const isLocked = isApiErrorCode(verifyPin.error, 'PIN_LOCKED');
  const isDisabled = verifyPin.isPending || isLocked;

  function close() {
    setPin('');
    verifyPin.reset();
    onClose();
  }

  function handleKey(key: (typeof KEYS)[number]) {
    if (isDisabled || key === '') return;
    Haptics.selectionAsync();

    if (key === 'delete') {
      setPin(pin.slice(0, -1));
      return;
    }

    const next = pin + key;
    setPin(next);
    if (next.length < PIN_LENGTH) return;

    // Six digits entered: check with the server right away, no "submit" button.
    verifyPin.mutate(next, {
      onSuccess: () => {
        setPin('');
        verifyPin.reset();
        onVerified();
      },
      onError: () => {
        setPin('');
        dotsShake.shake();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView
        edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <AppText variant="heading">Enter your app PIN</AppText>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={12}>
            <SymbolView name={{ ios: 'xmark', android: 'close' }} size={22} tintColor={colors.text} />
          </Pressable>
        </View>

        {notice && (
          <Card>
            <AppText variant="caption">{notice}</AppText>
          </Card>
        )}

        <Animated.View
          style={[styles.dots, dotsShake.style]}
          accessible
          accessibilityLabel={`${pin.length} of ${PIN_LENGTH} digits entered`}>
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { borderColor: colors.primary },
                index < pin.length && { backgroundColor: colors.primary },
              ]}
            />
          ))}
        </Animated.View>

        <View style={styles.status}>
          {verifyPin.isPending ? (
            <ActivityIndicator color={colors.textMuted} />
          ) : (
            <FieldError message={verifyPin.isError ? getErrorMessage(verifyPin.error) : undefined} />
          )}
        </View>

        <View style={styles.keypad}>
          {KEYS.map((key, index) =>
            key === '' ? (
              <View key={index} style={styles.key} />
            ) : (
              <Pressable
                key={index}
                onPress={() => handleKey(key)}
                disabled={isDisabled}
                accessibilityRole="button"
                accessibilityLabel={key === 'delete' ? 'Delete' : key}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: pressed ? colors.border : colors.surface },
                  isDisabled && styles.disabled,
                ]}>
                {key === 'delete' ? (
                  <SymbolView name={{ ios: 'delete.left', android: 'backspace' }} size={24} tintColor={colors.text} />
                ) : (
                  <AppText variant="title">{key}</AppText>
                )}
              </Pressable>
            ),
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  status: {
    minHeight: 40,
    alignItems: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
    marginTop: 'auto',
    paddingBottom: Spacing.lg,
  },
  key: {
    width: '30%',
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
