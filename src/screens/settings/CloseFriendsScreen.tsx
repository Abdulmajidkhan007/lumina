/**
 * Lumina — Close Friends screen
 *
 * Curate the Close Friends list. Shows current close friends up top, plus a
 * search to add more. Toggling a row adds/removes them immediately. Stories
 * shared to "Close Friends" are only visible to people on this list.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Spinner } from '@/design-system/primitives/Spinner';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { useCloseFriends } from '@/data/query/hooks/useCloseFriends';
import { useSetCloseFriend } from '@/data/query/hooks/useSetCloseFriend';
import { useSearchUsers } from '@/data/query/hooks/useSearchUsers';
import { useDebounce } from '@/features/explore/hooks/useDebounce';
import type { UserId, UserSummary } from '@/types/models';

export default function CloseFriendsScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { data: closeFriends, isLoading } = useCloseFriends();
  const { mutate: setCloseFriend } = useSetCloseFriend();
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 300);
  const { data: searchData } = useSearchUsers(debounced);

  const closeFriendIds = useMemo(
    () => new Set((closeFriends ?? []).map((u) => u.id)),
    [closeFriends],
  );

  // When searching, show search results; otherwise show the current list.
  const rows = useMemo<UserSummary[]>(() => {
    if (debounced.trim().length > 0) {
      return searchData?.pages.flatMap((p) => p.items) ?? [];
    }
    return closeFriends ?? [];
  }, [debounced, searchData, closeFriends]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const toggle = useCallback(
    (user: UserSummary) => {
      setCloseFriend({ id: user.id as UserId, isCloseFriend: !closeFriendIds.has(user.id) });
    },
    [setCloseFriend, closeFriendIds],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => {
      const isClose = closeFriendIds.has(item.id);
      return (
        <Pressable
          style={[styles.row, { paddingHorizontal: theme.spacing.lg }]}
          onPress={() => toggle(item)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isClose }}
          accessibilityLabel={`${item.username}${isClose ? ', in close friends' : ''}`}
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
            name={isClose ? 'checkmark-circle' : 'add-circle-outline'}
            size={26}
            color={isClose ? theme.colors.success : theme.colors.textTertiary}
          />
        </Pressable>
      );
    },
    [closeFriendIds, toggle, theme],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <SettingsScreenHeader title="Close Friends" onBack={goBack} backAccessibilityLabel="Go back" />

      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, marginHorizontal: theme.spacing.lg }]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textTertiary} />
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Search to add people"
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
          data={rows}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: theme.spacing.sm }}
          ListHeaderComponent={
            debounced.trim().length === 0 ? (
              <Text
                variant="caption"
                color="secondary"
                style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}
              >
                {rows.length === 0
                  ? 'Search above to add people to your Close Friends.'
                  : `${rows.length} in your Close Friends`}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginTop: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowText: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
