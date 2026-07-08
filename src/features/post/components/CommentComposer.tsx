/**
 * Lumina — CommentComposer
 *
 * Pinned bottom bar: current-user Avatar + TextInput + Send button.
 * Calls useAddComment optimistically; clears input immediately on submit.
 * Handles KeyboardAvoidingView + safe-area bottom inset.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Spinner } from '@/design-system/primitives/Spinner';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';
import { useAddComment } from '@/data/query/hooks';
import { useCurrentUser } from '@/stores/auth.store';
import type { PostId, CommentId } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommentComposerProps {
  postId: PostId;
  /** When set, the composer is replying to this comment */
  replyToCommentId?: CommentId;
  /** Label shown above composer when replying */
  replyToUsername?: string;
  onFocus?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommentComposer = React.memo(function CommentComposer({
  postId,
  replyToCommentId,
  replyToUsername,
  onFocus,
}: CommentComposerProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { mutate: addComment, isPending } = useAddComment();

  const canSend = text.trim().length > 0 && !isPending;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    // Clear immediately for optimistic UX
    setText('');
    inputRef.current?.blur();

    addComment({
      postId,
      text: trimmed,
      parentCommentId: replyToCommentId,
    });
  }, [text, isPending, addComment, postId, replyToCommentId]);

  const handleChangeText = useCallback((val: string) => {
    setText(val);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + theme.spacing.xs,
            paddingTop: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        {/* Reply context label */}
        {replyToUsername !== undefined && replyToUsername !== '' ? (
          <View style={[styles.replyBanner, { paddingBottom: theme.spacing.xs }]}>
            <Ionicons
              name="return-down-forward-outline"
              size={14}
              color={theme.colors.textTertiary}
            />
            <Text
              variant="caption"
              color="tertiary"
              style={{ marginLeft: theme.spacing.xs }}
            >
              {`Replying to @${replyToUsername}`}
            </Text>
          </View>
        ) : null}

        <View style={styles.row}>
          {/* Current user avatar */}
          <Avatar
            uri={currentUser?.avatarUrl ?? undefined}
            displayName={currentUser?.displayName}
            size="sm"
            accessibilityLabel="Your avatar"
          />

          {/* Text input */}
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: theme.radii.full,
                borderColor: theme.colors.border,
                marginHorizontal: theme.spacing.sm,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={handleChangeText}
              onFocus={onFocus}
              placeholder={
                replyToUsername !== undefined
                  ? `Reply to @${replyToUsername}…`
                  : 'Add a comment…'
              }
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.callout.fontSize,
                  lineHeight: theme.typography.callout.lineHeight,
                  paddingHorizontal: theme.spacing.md,
                },
              ]}
              multiline
              maxLength={2200}
              returnKeyType="send"
              blurOnSubmit={false}
              accessibilityLabel="Comment input"
              accessibilityHint="Type your comment here"
              onSubmitEditing={handleSend}
            />
          </View>

          {/* Send button */}
          {isPending ? (
            <Spinner size="sm" />
          ) : (
            <Pressable
              onPress={handleSend}
              hitSlop={hitSlop.md}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
              accessibilityState={{ disabled: !canSend }}
            >
              <Ionicons
                name="send"
                size={22}
                color={canSend ? theme.colors.accent : theme.colors.textTertiary}
              />
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    minHeight: 36,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
});
