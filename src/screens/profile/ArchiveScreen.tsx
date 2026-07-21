/**
 * Lumina — Archive screen
 *
 * 3-column grid of the current user's archived posts. Archived posts are
 * hidden from the feed and profile grid but preserved here; tapping one opens
 * it, long-pressing offers to restore it. Mirrors SavedPostsScreen's layout,
 * wired to useArchivedPosts + useArchivePost.
 */

import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';
import { Skeleton } from '@/design-system/primitives/Skeleton';
import { Image } from '@/components/Image';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { useArchivedPosts } from '@/data/query/hooks/useArchivedPosts';
import { useArchivePost } from '@/data/query/hooks/useArchivePost';
import { grid } from '@/constants/layout';
import type { Post, PostId } from '@/types/models';

function GridSkeleton(): React.JSX.Element {
  const CELL = grid.profileCellWidth;
  const skeletonItems = Array.from({ length: 9 }, (_, i) => i);
  return (
    <View style={styles.skeletonGrid}>
      {skeletonItems.map((i) => (
        <Skeleton key={i} width={CELL} height={CELL} radius={0} style={{ margin: grid.columnGap / 2 }} />
      ))}
    </View>
  );
}

interface ThumbProps {
  post: Post;
  onPress: (postId: string) => void;
  onRestore: (postId: PostId) => void;
}

const ArchivedThumbnail = React.memo(function ArchivedThumbnail({
  post,
  onPress,
  onRestore,
}: ThumbProps): React.JSX.Element {
  const CELL = grid.profileCellWidth;
  const firstMedia = post.media[0];

  const handlePress = useCallback(() => onPress(post.id), [onPress, post.id]);
  const handleLongPress = useCallback(() => onRestore(post.id), [onRestore, post.id]);

  return (
    <Pressable
      style={{ width: CELL, height: CELL, margin: grid.columnGap / 2 }}
      onPress={handlePress}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Archived post${post.caption ? ': ' + post.caption.slice(0, 40) : ''}. Long-press to restore.`}
    >
      {firstMedia !== undefined ? (
        <Image
          source={{ uri: firstMedia.uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={150}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.noMediaPlaceholder]} />
      )}
    </Pressable>
  );
});

export default function ArchiveScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useArchivedPosts();
  const { mutate: archivePost } = useArchivePost();

  const posts = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handlePostPress = useCallback(
    (postId: string) => navigation.navigate('PostDetail', { id: postId }),
    [navigation],
  );

  const handleRestore = useCallback(
    (postId: PostId) => {
      Alert.alert('Restore post', 'This post will be shown on your profile again.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => archivePost({ id: postId, archive: false }) },
      ]);
    },
    [archivePost],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <ArchivedThumbnail post={item} onPress={handlePostPress} onRestore={handleRestore} />
    ),
    [handlePostPress, handleRestore],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <SettingsScreenHeader title="Archive" onBack={goBack} backAccessibilityLabel="Go back" />
      {isLoading ? (
        <GridSkeleton />
      ) : isError ? (
        <ErrorState message="Couldn't load your archive." onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={grid.profileColumns}
          ListEmptyComponent={
            <EmptyState
              icon="archive-outline"
              title="Nothing archived"
              subtitle="Posts you archive are hidden from your profile but kept here. Long-press one to restore it."
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: theme.spacing['6xl'] }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  noMediaPlaceholder: { backgroundColor: '#E0E0E0' },
});
