import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountLookup } from '@/components/account-lookup';
import { FieldError } from '@/components/field-error';
import { RecipientRow } from '@/components/recipient-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useRecipients } from '@/hooks/queries';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/services/api-error';
import type { Recipient } from '@/services/types';
import { filterRecipients, looksLikeAccountNumber } from '@/utils/recipient';

type RecipientPickerProps = {
  visible: boolean;
  onSelect: (recipient: Recipient) => void;
  onClose: () => void;
};

/**
 * Native modal sheet for choosing a recipient: search saved recipients, or
 * type an account number to look up a new one. It lives inside the Send
 * screen, so the choice goes back through `onSelect` into local state.
 */
export function RecipientPicker({ visible, onSelect, onClose }: RecipientPickerProps) {
  const colors = useTheme();
  const recipients = useRecipients();
  const [query, setQuery] = useState('');

  const savedMatches = filterRecipients(recipients.data ?? [], query);
  const isAccountNumber = looksLikeAccountNumber(query);

  function close() {
    setQuery('');
    onClose();
  }

  function select(recipient: Recipient) {
    setQuery('');
    onSelect(recipient);
  }

  function renderSavedEmpty() {
    if (recipients.isPending) return <ActivityIndicator color={colors.textMuted} style={styles.empty} />;
    if (recipients.isError) {
      return (
        <View style={styles.empty}>
          <FieldError message={getErrorMessage(recipients.error)} />
          <Button title="Try again" variant="secondary" onPress={() => recipients.refetch()} loading={recipients.isFetching} />
        </View>
      );
    }
    return (
      <AppText color="textMuted" style={styles.emptyText}>
        No saved recipients match “{query}”
      </AppText>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      // iOS: a card sheet that can be swiped down. Android ignores this and shows full screen.
      presentationStyle="pageSheet"
      // Called on swipe-down (iOS) and the hardware back button (Android).
      onRequestClose={close}>
      <SafeAreaView
        // An iOS page sheet already sits below the status bar; Android's full-screen modal doesn't.
        edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']}
        style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <AppText variant="heading">Choose recipient</AppText>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12}>
            <SymbolView name={{ ios: 'xmark', android: 'close' }} size={22} tintColor={colors.text} />
          </Pressable>
        </View>

        <View style={[styles.search, { backgroundColor: colors.surface }]}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search' }} size={18} tintColor={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Name, bank or account number"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {isAccountNumber && <AccountLookup accountNumber={query.trim()} onSelect={select} />}

        <AppText variant="label" color="textMuted">
          Saved
        </AppText>
        <FlatList
          data={savedMatches}
          keyExtractor={(recipient) => recipient.id}
          renderItem={({ item }) => <RecipientRow recipient={item} onPress={() => select(item)} />}
          // Let a tap on a row select it even while the keyboard is open (otherwise the first tap only dismisses the keyboard).
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderSavedEmpty()}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  empty: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
