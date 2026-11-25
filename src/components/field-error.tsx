import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FieldErrorProps = {
  message?: string;
};

/** Inline error under a form field. Renders nothing when there's no message. */
export function FieldError({ message }: FieldErrorProps) {
  const colors = useTheme();
  if (!message) return null;

  return (
    <View style={styles.row}>
      <SymbolView name={{ ios: 'exclamationmark.circle.fill', android: 'error' }} size={16} tintColor={colors.danger} />
      <AppText
        variant="caption"
        color="danger"
        style={styles.text}
        // Screen readers announce the message when it appears (Android: live region, iOS: alert role).
        accessibilityLiveRegion="polite"
        accessibilityRole="alert">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  text: {
    flex: 1,
  },
});
