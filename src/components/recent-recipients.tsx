import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTransactions } from '@/hooks/queries';
import { useTheme } from '@/hooks/use-theme';
import type { Recipient } from '@/services/types';
import { getInitials } from '@/utils/recipient';
import { getRecentRecipients } from '@/utils/transactions';

const MAX_RECENT = 6;

type RecentRecipientsProps = {
  selectedId: string | null;
  onSelect: (recipient: Recipient) => void;
};

/** One-tap chips for people the user recently paid, taken from the history already in the cache. */
export function RecentRecipients({ selectedId, onSelect }: RecentRecipientsProps) {
  const colors = useTheme();
  const history = useTransactions();
  const recipients = getRecentRecipients(history.data?.pages.flatMap((page) => page.items) ?? [], MAX_RECENT);

  // Nothing to suggest yet (still loading, failed, or no transfers): just leave the row out.
  if (recipients.length === 0) return null;

  return (
    <View style={styles.container}>
      <AppText variant="label">Recent</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {recipients.map((recipient) => {
          const isSelected = recipient.id === selectedId;
          return (
            <Pressable
              key={recipient.id}
              onPress={() => onSelect(recipient)}
              accessibilityRole="button"
              accessibilityLabel={`Send to ${recipient.name}`}
              accessibilityState={{ selected: isSelected }}
              style={styles.chip}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isSelected ? colors.primary : colors.primarySoft },
                ]}>
                <AppText variant="label" color={isSelected ? 'onPrimary' : 'primary'}>
                  {getInitials(recipient.name)}
                </AppText>
              </View>
              <AppText variant="caption" numberOfLines={1}>
                {recipient.name.split(' ')[0]}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  chips: {
    gap: Spacing.md,
  },
  chip: {
    width: 64,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
