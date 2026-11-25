import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipientRow } from '@/components/recipient-row';
import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Recipient } from '@/services/types';
import { filterRecipients } from '@/utils/recipient';

type RecipientPickerProps = {
  visible: boolean;
  recipients: Recipient[];
  onSelect: (recipient: Recipient) => void;
  onClose: () => void;
};

/**
 * Native modal sheet for choosing a recipient. It lives inside the Send
 * screen, so the choice goes back through `onSelect` into local state.
 */
export function RecipientPicker({ visible, recipients, onSelect, onClose }: RecipientPickerProps) {
  const colors = useTheme();
  const [query, setQuery] = useState('');
  const results = filterRecipients(recipients, query);

  function close() {
    setQuery('');
    onClose();
  }

  function select(recipient: Recipient) {
    setQuery('');
    onSelect(recipient);
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

        <FlatList
          data={results}
          keyExtractor={(recipient) => recipient.id}
          renderItem={({ item }) => <RecipientRow recipient={item} onPress={() => select(item)} />}
          // Let a tap on a row select it even while the keyboard is open (otherwise the first tap only dismisses the keyboard).
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <AppText color="textMuted" style={styles.empty}>
              No recipients match “{query}”
            </AppText>
          }
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
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
