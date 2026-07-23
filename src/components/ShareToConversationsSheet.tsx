/**
 * Lumina — ShareToConversationsSheet
 *
 * Bottom modal that lets the user share a post into one or more of their
 * Direct conversations (Instagram's "send" flow). Lists conversations with a
 * multi-select, then calls useShareToConversations on Send.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Button } from '@/design-system/primitives/Button';
import { Spinner } from '@/design-system/primitives/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { useConversations } from '@/data/query/hooks/useConversations';
import { useShareToConversations } from '@/data/query/hooks/useShareToConversations';
import { useCurrentUser } from '@/stores/auth.store';
import { hitSlop } from '@/constants/layout';
import type { Conversation, ConversationId, PostId } from '@/types/models';

export interface ShareToConversationsSheetProps {
  visible: boolean;
  postId: PostId;
  onClose: () => void;
}

export function ShareToConversationsSheet({
  visible,
  postId,
  onClose,
}: ShareToConversationsSheetProps): React.JSX.Element {
  const theme = useTheme();
  const currentUser = useCurrentUser();
  const { data: conversations, isLoading } = useConversations();
  const share = useShareToConversations();
  const [selected, setSelected] = useState<ConversationId[]>([]);

  const toggle = useCallback((id: ConversationId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleSend = useCallback(() => {
    if (selected.length === 0) return;
    share.mutate(
      { postId, conversationIds: selected },
      {
        onSettled: () => {
          setSelected([]);
          onClose();
        },
      },
    );
  }, [selected, share, postId, onClose]);

  const otherName = useCallback(
    (c: Conversation) => {
      const other = c.participants.find((p) => p.id !== currentUser?.id) ?? c.participants[0];
      return other;
    },
    [currentUser?.id],
  );

  const rows = useMemo(() => conversations ?? [], [conversations]);

  // External link to the post (opens on the web app once its post page ships).
  const postLink = `https://lumina-007app.web.app/p/${postId}`;

  const handleCopyLink = useCallback(() => {
    Clipboard.setString(postLink);
    Alert.alert('Link copied', 'The post link has been copied to your clipboard.');
  }, [postLink]);

  const handleShareExternal = useCallback(() => {
    void Share.share({ message: postLink }).catch(() => {
      // Share sheet dismissed — no action needed.
    });
  }, [postLink]);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => {
      const other = otherName(item);
      const isSel = selected.includes(item.id);
      return (
        <Pressable
          style={[styles.row, { paddingHorizontal: theme.spacing.lg }]}
          onPress={() => toggle(item.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSel }}
          accessibilityLabel={other?.username ?? 'Conversation'}
        >
          <Avatar uri={other?.avatarUrl ?? undefined} displayName={other?.displayName} size="md" />
          <Text variant="callout" color="primary" style={styles.rowText} numberOfLines={1}>
            {other?.username ?? 'Conversation'}
          </Text>
          <Ionicons
            name={isSel ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isSel ? theme.colors.accent : theme.colors.textTertiary}
          />
        </Pressable>
      );
    },
    [otherName, selected, toggle, theme],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityLabel="Dismiss" accessibilityRole="button" />
        <SafeAreaView
          style={[styles.sheet, { backgroundColor: theme.colors.background }]}
          edges={['bottom']}
        >
          <View style={styles.grabberWrap}>
            <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
          </View>
          <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
            <Text variant="bodyStrong" color="primary">
              Share
            </Text>
            <Pressable onPress={onClose} hitSlop={hitSlop.md} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close-outline" size={26} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <Spinner size="md" />
            </View>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(c) => c.id}
              renderItem={renderItem}
              style={styles.list}
              ListEmptyComponent={
                <EmptyState
                  icon="paper-plane-outline"
                  title="No conversations yet"
                  subtitle="Start a chat first, then you can share posts into it."
                />
              }
            />
          )}

          {/* External share row — copy link / share to other apps */}
          <View style={[styles.externalRow, { borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing.lg }]}>
            <Pressable style={styles.externalAction} onPress={handleCopyLink} accessibilityRole="button" accessibilityLabel="Copy link">
              <View style={[styles.externalIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="link-outline" size={22} color={theme.colors.textPrimary} />
              </View>
              <Text variant="caption" color="secondary">Copy link</Text>
            </Pressable>
            <Pressable style={styles.externalAction} onPress={handleShareExternal} accessibilityRole="button" accessibilityLabel="Share to other apps">
              <View style={[styles.externalIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="share-social-outline" size={22} color={theme.colors.textPrimary} />
              </View>
              <Text variant="caption" color="secondary">Share to…</Text>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }}>
            <Button
              label={selected.length > 0 ? `Send (${selected.length})` : 'Send'}
              variant="primary"
              size="md"
              fullWidth
              loading={share.isPending}
              disabled={selected.length === 0 || share.isPending}
              onPress={handleSend}
              accessibilityLabel="Send to selected conversations"
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdropFill: { flex: 1 },
  sheet: { maxHeight: '75%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  grabberWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  list: { minHeight: 120 },
  center: { paddingVertical: 40, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowText: { flex: 1 },
  externalRow: {
    flexDirection: 'row',
    gap: 28,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  externalAction: { alignItems: 'center', gap: 6 },
  externalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

