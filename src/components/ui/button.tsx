import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing, type ColorName } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Shows a spinner and blocks presses, e.g. while a transfer is in flight. */
  loading?: boolean;
};

const backgroundFor: Record<ButtonVariant, ColorName | null> = {
  primary: 'primary',
  secondary: 'primarySoft',
  ghost: null,
};

const textColorFor: Record<ButtonVariant, ColorName> = {
  primary: 'onPrimary',
  secondary: 'primary',
  ghost: 'primary',
};

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false }: ButtonProps) {
  const colors = useTheme();
  const background = backgroundFor[variant];
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background ? colors[background] : 'transparent' },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[textColorFor[variant]]} />
      ) : (
        <AppText variant="label" color={textColorFor[variant]}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
});
