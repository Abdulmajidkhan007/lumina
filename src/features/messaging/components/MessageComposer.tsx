/**
 * Lumina — MessageComposer
 *
 * Pinned-to-bottom composer bar with a multiline TextInput and a Send button.
 * Calls useSendMessage with an optimistic update. Clears the input on send.
 * Disabled while text is empty or a send is in-flight.
 *
 * KeyboardAvoidingView is handled by the parent screen via KeyboardAvoidingView
 * so this component only manages its own safe-area bottom inset.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Spinner } from '@/design-system/primitives/Spinner';
import type { ConversationId, UserSummary } from '@/types/models';
import { useSendMessage } from '@/data/query/hooks/useSendMessage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageComposerProps {
  conversationId: ConversationId;
  currentUserSummary: UserSummary;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageComposer({
  conversationId,
  currentUserSummary,
}: MessageComposerProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { mutate: sendMessage, isPending } = useSendMessage(currentUserSummary);

  const canSend = text.trim().length > 0 && !isPending;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    sendMessage(
      { conversationId, text: trimmed },
      {
        onSuccess: () => {
          setText('');
          // Return focus to input after send
          inputRef.current?.focus();
        },
      },
    );
  }, [text, isPending, sendMessage, conversationId]);

  const handleChangeText = useCallback((value: string) => {
    setText(value);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          paddingBottom: insets.bottom + theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
        },
      ]}
    >
      {/* Input row */}
      <View
        style={[
          styles.row,
          { gap: theme.spacing.sm },
        ]}
      >
        {/* Text input container */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii['2xl'],
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleChangeText}
            placeholder="Message…"
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={2000}
            returnKeyType="default"
            blurOnSubmit={false}
            accessibilityLabel="Message input"
            accessibilityRole="none"
            style={[
              styles.input,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.callout.fontSize,
                lineHeight: theme.typography.callout.lineHeight,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                maxHeight: 120,
              },
            ]}
          />
        </View>

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSend
                ? theme.colors.accent
                : theme.colors.surface,
              opacity: canSend ? (pressed ? 0.75 : 1) : 0.4,
              width: 40,
              height: 40,
              borderRadius: theme.radii.full,
            },
          ]}
        >
          {isPending ? (
            <Spinner size="sm" colorVariant="inverse" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color={canSend ? theme.colors.background : theme.colors.textTertiary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    overflow: 'hidden',
  },
  input: {
    // multiline height is dynamic
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
});
