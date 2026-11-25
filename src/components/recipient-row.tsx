import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Recipient } from '@/services/types';
import { getInitials, maskAccountNumber } from '@/utils/recipient';

type RecipientRowProps = {
  recipient: Recipient;
  onPress: () => void;
  /** Shows a chevron, for rows that open something (e.g. "change recipient"). */
  showChevron?: boolean;
};

export function RecipientRow({ recipient, onPress, showChevron = false }: RecipientRowProps) {
  const colors = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${recipient.name}, ${recipient.bankName}, account ending ${recipient.accountNumber.slice(-4)}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
        <AppText variant="label" color="primary">
          {getInitials(recipient.name)}
        </AppText>
      </View>
      <View style={styles.text}>
        <AppText variant="body">{recipient.name}</AppText>
        <AppText variant="caption" color="textMuted">
          {recipient.bankName} {maskAccountNumber(recipient.accountNumber)}
        </AppText>
      </View>
      {showChevron && (
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={18} tintColor={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
