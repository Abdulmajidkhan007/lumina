/**
 * Lumina — Post detail screen
 *
 * Full post view: header nav + PostDetail body.
 * Loading → PostDetailSkeleton, error → ErrorState + retry, missing id → ErrorState.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { ErrorState } from '@/components/ErrorState';
import { hitSlop } from '@/constants/layout';
import { usePost } from '@/data/query/hooks/usePost';
import { useComments } from '@/data/query/hooks/useComments';
import { PostDetail } from '@/features/post/components/PostDetail';
import { PostDetailSkeleton } from '@/features/post/components/PostDetailSkeleton';
import type { PostId } from '@/types/models';

// ---------------------------------------------------------------------------
// Route params
// ---------------------------------------------------------------------------

type PostParams = { id: string };

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PostDetailScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<PostParams>();

  const hasId = typeof id === 'string' && id.length > 0;
  const postId = (id ?? '') as PostId;

  const {
    data: post,
    isLoading,
    isError,
    refetch,
  } = usePost(postId, { enabled: hasId });

  // Load a preview of top-level comments (first page only)
  const { data: commentsData } = useComments(postId, undefined, { enabled: hasId });

  const goBack = useCallback(() => router.back(), [router]);

  const handleViewAllComments = useCallback(() => {
    if (hasId) {
      router.push(`/(protected)/comments/${postId}`);
    }
  }, [router, hasId, postId]);

  // ---- Missing / bad param guard ----
  if (!hasId) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <Header onBack={goBack} />
        <View style={styles.body}>
          <ErrorState message="Post not found." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Header onBack={goBack} />

      {isLoading ? (
        <View style={styles.body}>
          <PostDetailSkeleton />
        </View>
      ) : isError || post === undefined ? (
        <View style={styles.body}>
          <ErrorState
            message="Couldn't load this post."
            onRetry={refetch}
          />
        </View>
      ) : (
        <View style={styles.body}>
          <PostDetail
            post={post}
            previewComments={commentsData?.pages[0]?.items.slice(0, 3) ?? []}
            onViewAllComments={handleViewAllComments}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Header sub-component
// ---------------------------------------------------------------------------

interface HeaderProps {
  onBack: () => void;
}

function Header({ onBack }: HeaderProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.background,
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
        Post
      </Text>

      {/* Spacer keeps title centred */}
      <View style={styles.headerSpacer} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 24 },
  body: { flex: 1 },
});
