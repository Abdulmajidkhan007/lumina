/**
 * Lumina — Followers list screen
 *
 * Infinite-scroll FlashList of UserListItem.
 * Each row shows follow button (optimistic) and navigates to user/[id].
 */

import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Divider } from '@/design-system/primitives/Divider';
import { SkeletonChatRow } from '@/design-system/primitives/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useFollowers } from '@/data/query/hooks/useFollowers';
import { useCurrentUser } from '@/stores/auth.store';
import { hitSlop } from '@/constants/layout';
import { UserListItem } from '@/features/profile/components/UserListItem';
import type { UserSummary, UserId } from '@/types/models';
import { userIdSchema } from '@/schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseUserId(raw: string | string[] | undefined): UserId | null {
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  const result = userIdSchema.safeParse(str);
  return result.success ? result.data : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------


export default function FollowersScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { id: rawId } = useRoute<RouteProp<ProtectedStackParamList, 'Followers'>>().params;
  const currentUser = useCurrentUser();

  const userId = parseUserId(rawId);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFollowers(userId as UserId);

  const followers = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleUserPress = useCallback(
    (id: string) => {
      navigation.navigate('UserProfile', { id: id });
    },
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => (
      <UserListItem
        user={item}
        isFollowedByMe={false}
        isMe={item.id === currentUser?.id}
        onPress={handleUserPress}
      />
    ),
    [handleUserPress, currentUser?.id],
  );

  const keyExtractor = useCallback((item: UserSummary) => item.id, []);

  const ItemSeparator = useCallback(() => <Divider mx={theme.spacing.lg} />, [theme]);

  // Guard: invalid id
  if (userId === null) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <NavHeader title="Followers" onBack={goBack} theme={theme} />
        <View style={styles.body}>
          <ErrorState message="Invalid user." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <NavHeader title="Followers" onBack={goBack} theme={theme} />

      {isLoading ? (
        <View style={styles.body}>
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonChatRow key={i} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.body}>
          <ErrorState
            message="Couldn't load followers."
            onRetry={() => void refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No followers yet"
              subtitle="When someone follows this account they'll appear here."
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// NavHeader
// ---------------------------------------------------------------------------

interface NavHeaderProps {
  title: string;
  onBack: () => void;
  theme: ReturnType<typeof useTheme>;
}

function NavHeader({ title, onBack, theme }: NavHeaderProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.navHeader,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={hitSlop.md}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color={theme.colors.textPrimary}
        />
      </Pressable>
      <Text variant="bodyStrong" color="primary">
        {title}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  navHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 24 },
  body: { flex: 1 },
});
