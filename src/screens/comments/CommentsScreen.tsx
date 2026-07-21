/**
 * Lumina — Comments modal screen
 *
 * Full-screen modal presented from the post detail.
 * - Header: grabber + "Comments" title + close button
 * - Infinite FlatList of CommentItem rows via CommentList
 * - CommentComposer pinned to bottom (KeyboardAvoidingView inside composer)
 * - Loading: inline spinner, error: ErrorState, empty: EmptyState (inside CommentList)
 * - Typed, guarded postId param; guard → ErrorState
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Spinner } from '@/design-system/primitives/Spinner';
import { Divider } from '@/design-system/primitives/Divider';
import { ErrorState } from '@/components/ErrorState';
import { hitSlop } from '@/constants/layout';
import { useComments } from '@/data/query/hooks/useComments';
import { useCurrentUser } from '@/stores/auth.store';
import { CommentList } from '@/features/post/components/CommentList';
import { CommentComposer } from '@/features/post/components/CommentComposer';
import type { PostId, Comment, CommentId } from '@/types/models';

// ---------------------------------------------------------------------------
// Route params
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CommentsScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const { postId: postIdParam, postAuthorId } =
    useRoute<RouteProp<ProtectedStackParamList, 'Comments'>>().params;

  const hasId = typeof postIdParam === 'string' && postIdParam.length > 0;
  const postId = (postIdParam ?? '') as PostId;
  const currentUser = useCurrentUser();
  // Only the post's author may pin/unpin comments.
  const canModerate = !!postAuthorId && postAuthorId === currentUser?.id;

  // Reply state
  const [replyTo, setReplyTo] = useState<{
    commentId: CommentId;
    username: string;
  } | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useComments(postId, undefined, { enabled: hasId });

  const dismiss = useCallback(() => navigation.goBack(), [navigation]);

  const handleAuthorPress = useCallback(
    (userId: string) => {
      navigation.navigate('UserProfile', { id: userId });
    },
    [navigation],
  );

  const handleReply = useCallback((comment: Comment) => {
    setReplyTo({ commentId: comment.id, username: comment.author.username });
  }, []);

  const handleClearReply = useCallback(() => setReplyTo(null), []);

  // Flatten all pages into a single array, pinned comment first.
  const comments = useMemo(() => {
    const flat = data?.pages.flatMap((page) => page.items) ?? [];
    return [...flat].sort((a, b) => Number(b.isPinned ?? false) - Number(a.isPinned ?? false));
  }, [data]);

  // ---- Missing param guard ----
  if (!hasId) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <ModalHeader onDismiss={dismiss} />
        <View style={styles.body}>
          <ErrorState message="Invalid post reference." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ModalHeader onDismiss={dismiss} />
      <Divider />

      {/* Reply context banner */}
      {replyTo !== null ? (
        <View
          style={[
            styles.replyBanner,
            {
              backgroundColor: theme.colors.surface,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.xs,
            },
          ]}
        >
          <Text variant="caption" color="secondary">
            Replying to{' '}
            <Text variant="caption" color="accent">
              @{replyTo.username}
            </Text>
          </Text>
          <Pressable
            onPress={handleClearReply}
            hitSlop={hitSlop.sm}
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        </View>
      ) : null}

      {/* Content area */}
      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.center}>
            <Spinner size="md" />
          </View>
        ) : isError ? (
          <ErrorState
            message="Couldn't load comments."
            onRetry={refetch}
          />
        ) : (
          <CommentList
            postId={postId}
            comments={comments}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            onReply={handleReply}
            onAuthorPress={handleAuthorPress}
            canModerate={canModerate}
          />
        )}
      </View>

      {/* Composer pinned to bottom */}
      <CommentComposer
        postId={postId}
        replyToCommentId={replyTo?.commentId}
        replyToUsername={replyTo?.username}
        onFocus={handleClearReply}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// ModalHeader sub-component
// ---------------------------------------------------------------------------

interface ModalHeaderProps {
  onDismiss: () => void;
}

function ModalHeader({ onDismiss }: ModalHeaderProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.header,
        {
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* Grabber pill */}
      <View style={styles.grabberWrap}>
        <View
          style={[
            styles.grabber,
            { backgroundColor: theme.colors.border },
          ]}
        />
      </View>

      {/* Title row */}
      <View style={styles.titleRow}>
        <Text variant="bodyStrong" color="primary">
          Comments
        </Text>
        <Pressable
          onPress={onDismiss}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Close comments"
        >
          <Ionicons
            name="close-outline"
            size={26}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabberWrap: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
