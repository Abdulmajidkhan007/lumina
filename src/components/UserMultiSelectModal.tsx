/**
 * Lumina — UserMultiSelectModal
 *
 * A reusable full-screen modal for selecting multiple users by searching.
 * Used for tagging people in a post, inviting collaborators, and picking
 * Close Friends. Returns the chosen UserSummary[] via `onDone`.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Spinner } from '@/design-system/primitives/Spinner';
import { useSearchUsers } from '@/data/query/hooks/useSearchUsers';
import { useDebounce } from '@/features/explore/hooks/useDebounce';
import { hitSlop } from '@/constants/layout';
import type { UserSummary } from '@/types/models';

export interface UserMultiSelectModalProps {
  visible: boolean;
  title: string;
  /** Users already selected when the modal opens. */
  initialSelected: UserSummary[];
  onClose: () => void;
  onDone: (selected: UserSummary[]) => void;
}

export function UserMultiSelectModal({
  visible,
  title,
  initialSelected,
  onClose,
  onDone,
}: UserMultiSelectModalProps): React.JSX.Element {
  const theme = useTheme();
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<UserSummary[]>(initialSelected);
  const debounced = useDebounce(term, 300);
  const { data, isLoading } = useSearchUsers(debounced);

  const results = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const toggle = useCallback((user: UserSummary) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  }, []);

  const handleDone = useCallback(() => {
    onDone(selected);
    onClose();
  }, [onDone, onClose, selected]);

  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => {
      const isSelected = selected.some((u) => u.id === item.id);
      return (
        <Pressable
          style={[styles.row, { paddingHorizontal: theme.spacing.lg }]}
          onPress={() => toggle(item)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`${item.username}${isSelected ? ', selected' : ''}`}
        >
          <Avatar uri={item.avatarUrl ?? undefined} displayName={item.displayName} size="md" />
          <View style={styles.rowText}>
            <Text variant="callout" color="primary" numberOfLines={1}>
              {item.username}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {item.displayName}
            </Text>
          </View>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isSelected ? theme.colors.accent : theme.colors.textTertiary}
          />
        </Pressable>
      );
    },
    [selected, toggle, theme],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg }]}>
          <Pressable onPress={onClose} hitSlop={hitSlop.md} accessibilityRole="button" accessibilityLabel="Cancel">
            <Ionicons name="close-outline" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <Text variant="bodyStrong" color="primary">
            {title}
          </Text>
          <Pressable onPress={handleDone} hitSlop={hitSlop.md} accessibilityRole="button" accessibilityLabel="Done">
            <Text variant="bodyStrong" color="accent">
              Done{selected.length > 0 ? ` (${selected.length})` : ''}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, marginHorizontal: theme.spacing.lg }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textTertiary} />
          <TextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Search people"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <Spinner size="md" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(u) => u.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: theme.spacing.sm }}
            ListEmptyComponent={
              debounced.trim().length > 0 ? (
                <View style={styles.center}>
                  <Text variant="callout" color="tertiary">
                    No people found
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowText: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
});
