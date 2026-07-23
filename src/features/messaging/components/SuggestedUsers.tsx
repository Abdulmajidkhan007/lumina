/**
 * Lumina — SuggestedUsers
 *
 * Shown in the Direct inbox when the user has no conversations yet: a list of
 * suggested accounts they can tap to start a chat with. Tapping opens (or
 * creates) the 1:1 conversation and navigates into the thread.
 */

import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Spinner } from '@/design-system/primitives/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { useSuggestedUsers } from '@/data/query/hooks/useSuggestedUsers';
import { useStartConversation } from '@/data/query/hooks/useStartConversation';
import type { ProtectedStackParamList } from '@/navigation';
import type { UserId, UserSummary } from '@/types/models';

export function SuggestedUsers(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { data: users, isLoading } = useSuggestedUsers();
  const startConversation = useStartConversation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const open = useCallback(
    (userId: string) => {
      setPendingId(userId);
      startConversation.mutate(userId as UserId, {
        onSuccess: (conversation) => {
          setPendingId(null);
          navigation.navigate('MessageThread', { threadId: conversation.id });
        },
        onError: (error) => {
          setPendingId(null);
          Alert.alert('Error', error instanceof Error ? error.message : 'Could not open the conversation.');
        },
      });
    },
    [navigation, startConversation],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => (
      <Pressable
        style={[styles.row, { paddingHorizontal: theme.spacing.lg }]}
        onPress={() => open(item.id)}
        disabled={pendingId !== null}
        accessibilityRole="button"
        accessibilityLabel={`Message ${item.username}`}
      >
        <Avatar uri={item.avatarUrl ?? undefined} displayName={item.displayName} size="md" />
        <View style={styles.rowText}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {item.username}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={1}>
            {item.displayName}
          </Text>
        </View>
        {pendingId === item.id ? (
          <Spinner size="sm" colorVariant="accent" />
        ) : (
          <Text variant="caption" color="accent">
            Message
          </Text>
        )}
      </Pressable>
    ),
    [open, pendingId, theme],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Spinner size="md" />
      </View>
    );
  }

  if (!users || users.length === 0) {
    return (
      <EmptyState
        icon="chatbubbles-outline"
        title="No messages yet"
        subtitle="Search for people to start a conversation."
      />
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <Text
          variant="caption"
          color="secondary"
          style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}
        >
          Suggested for you
        </Text>
      }
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowText: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
