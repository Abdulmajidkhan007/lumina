/**
 * Lumina — Saved posts screen
 *
 * 3-column grid of the current user's saved posts (bookmark toggles on
 * PostDetail/feed write here). Self-contained — mirrors the layout of
 * ProfilePostGrid but is wired to useSavedPosts instead of a user's own
 * feed, since "my saves" isn't scoped to a single author.
 */

import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Skeleton } from '@/design-system/primitives/Skeleton';
import { Image } from '@/components/Image';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SettingsScreenHeader } from '@/features/settings/components/SettingsScreenHeader';
import { useSavedPosts } from '@/data/query/hooks/useSavedPosts';
import { grid } from '@/constants/layout';
import type { Post } from '@/types/models';

// ---------------------------------------------------------------------------
// Grid skeleton
// ---------------------------------------------------------------------------

function GridSkeleton(): React.JSX.Element {
  const CELL = grid.profileCellWidth;
  const skeletonItems = Array.from({ length: 9 }, (_, i) => i);

  return (
    <View style={styles.skeletonGrid}>
      {skeletonItems.map((i) => (
        <Skeleton
          key={i}
          width={CELL}
          height={CELL}
          radius={0}
          style={{ margin: grid.columnGap / 2 }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SavedPostThumbnail — memoized grid cell
// ---------------------------------------------------------------------------

interface SavedPostThumbnailProps {
  post: Post;
  onPress: (postId: string) => void;
}

const SavedPostThumbnail = React.memo(function SavedPostThumbnail({
  post,
  onPress,
}: SavedPostThumbnailProps): React.JSX.Element {
  const CELL = grid.profileCellWidth;
  const firstMedia = post.media[0];

  const handlePress = useCallback(() => {
    onPress(post.id);
  }, [onPress, post.id]);

  return (
    <Pressable
      style={{ width: CELL, height: CELL, margin: grid.columnGap / 2 }}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View post${post.caption ? ': ' + post.caption.slice(0, 40) : ''}`}
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SavedPostsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSavedPosts();

  const posts = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const handlePostPress = useCallback(
    (postId: string) => {
      navigation.navigate('PostDetail', { id: postId });
    },
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <SavedPostThumbnail post={item} onPress={handlePostPress} />
    ),
    [handlePostPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const listContentStyle = useMemo(
    () => ({ paddingBottom: theme.spacing['6xl'] }),
    [theme.spacing],
  );

  const renderEmpty = useCallback(
    () => (
      <EmptyState
        icon="bookmark-outline"
        title={t('savedPosts.emptyTitle')}
        subtitle={t('savedPosts.emptySubtitle')}
      />
    ),
    [t],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <SettingsScreenHeader
        title={t('savedPosts.title')}
        onBack={goBack}
        backAccessibilityLabel={t('savedPosts.goBack')}
      />

      {isLoading ? (
        <GridSkeleton />
      ) : isError ? (
        <ErrorState message={t('savedPosts.error')} onRetry={handleRetry} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={grid.profileColumns}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noMediaPlaceholder: {
    backgroundColor: '#E0E0E0',
  },
});
