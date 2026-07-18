/**
 * Lumina — New conversation screen
 *
 * Search users (debounced) and tap one to open (or create) a 1:1 conversation,
 * then navigate straight into the thread. Reuses the same user-search data
 * path as Explore.
 */

import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View, type ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import type { ProtectedStackParamList } from '@/navigation';
import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Spinner } from '@/design-system/primitives/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { hitSlop } from '@/constants/layout';
import type { UserSummary, UserId } from '@/types/models';
import { useSearchUsers } from '@/data/query/hooks/useSearchUsers';
import { useDebounce } from '@/features/explore/hooks/useDebounce';
import { useStartConversation } from '@/data/query/hooks/useStartConversation';

export default function NewConversationScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 300);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } =
    useSearchUsers(debounced);
  const startConversation = useStartConversation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const users = data?.pages.flatMap((p) => p.items) ?? [];

  const openConversation = useCallback(
    (userId: string) => {
      setPendingId(userId);
      startConversation.mutate(userId as UserId, {
        onSuccess: (conversation) => {
          setPendingId(null);
          navigation.replace('MessageThread', { threadId: conversation.id });
        },
        onError: () => setPendingId(null),
      });
    },
    [navigation, startConversation],
  );

  const renderItem = useCallback<ListRenderItem<UserSummary>>(
    ({ item }) => (
      <Pressable
        onPress={() => openConversation(item.id)}
        disabled={pendingId !== null}
        style={({ pressed }) => [
          styles.row,
          { opacity: pressed || (pendingId !== null && pendingId !== item.id) ? 0.6 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={item.username}
      >
        <Avatar uri={item.avatarUrl ?? undefined} displayName={item.displayName} size="md" />
        <View style={styles.rowText}>
          <Text variant="bodyStrong">{item.username}</Text>
          <Text variant="caption" color="secondary">
            {item.displayName}
          </Text>
        </View>
        {pendingId === item.id ? <Spinner size="sm" colorVariant="accent" /> : null}
      </Pressable>
    ),
    [openConversation, pendingId],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={hitSlop.md} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
          <Ionicons name="close" size={26} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="headline">{t('messages.newConversationTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.colors.textTertiary} />
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder={t('messages.searchPeople')}
          placeholderTextColor={theme.colors.textTertiary}
          style={[styles.input, { color: theme.colors.textPrimary }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {isError ? (
        <ErrorState message={t('messages.searchError')} onRetry={() => void refetch()} />
      ) : isLoading && debounced.trim().length > 0 ? (
        <View style={styles.center}>
          <Spinner size="md" colorVariant="accent" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (hasNextPage) void fetchNextPage();
          }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            debounced.trim().length > 0 ? (
              <EmptyState icon="people-outline" title={t('messages.noPeopleFound')} />
            ) : (
              <EmptyState icon="search-outline" title={t('messages.searchPeoplePrompt')} />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 26 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  rowText: { flex: 1 },
});
