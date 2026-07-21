/**
 * Lumina — NotesStrip
 *
 * The horizontal row of "Notes" shown at the top of the Direct inbox. The
 * first item is always the current user's own note (a composer prompt when
 * empty, the live note when set); the rest are the active notes of people
 * they follow. Tapping your own note opens a small composer modal; tapping
 * someone else's opens (or creates) a 1:1 conversation with them.
 */

import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { useNotes } from '@/data/query/hooks/useNotes';
import { useSetNote } from '@/data/query/hooks/useSetNote';
import { useClearNote } from '@/data/query/hooks/useClearNote';
import { useStartConversation } from '@/data/query/hooks/useStartConversation';
import { useCurrentUser } from '@/stores/auth.store';
import type { Note, UserId } from '@/types/models';
import { NOTE_MAX_LENGTH } from '@/schemas';
import type { ProtectedStackParamList } from '@/navigation';

const BUBBLE_MAX_WIDTH = 84;

export function NotesStrip(): React.JSX.Element | null {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();
  const { data: notes } = useNotes();
  const setNote = useSetNote();
  const clearNote = useClearNote();
  const startConversation = useStartConversation();

  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const ownNote = notes?.find((n) => n.author.id === currentUser?.id) ?? null;
  const otherNotes = notes?.filter((n) => n.author.id !== currentUser?.id) ?? [];

  const openComposer = useCallback(() => {
    setDraft(ownNote?.text ?? '');
    setComposerOpen(true);
  }, [ownNote]);

  const closeComposer = useCallback(() => setComposerOpen(false), []);

  const handleShare = useCallback(() => {
    const text = draft.trim();
    if (text.length === 0) return;
    setNote.mutate(text, { onSettled: () => setComposerOpen(false) });
  }, [draft, setNote]);

  const handleClear = useCallback(() => {
    clearNote.mutate(undefined, { onSettled: () => setComposerOpen(false) });
  }, [clearNote]);

  const handleOpenOther = useCallback(
    (note: Note) => {
      startConversation.mutate(note.author.id as UserId, {
        onSuccess: (conversation) => {
          navigation.navigate('MessageThread', { threadId: conversation.id });
        },
      });
    },
    [navigation, startConversation],
  );

  if (!currentUser) return null;

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
      >
        {/* Own note / composer entry */}
        <Pressable
          style={styles.item}
          onPress={openComposer}
          accessibilityRole="button"
          accessibilityLabel={ownNote ? 'Edit your note' : 'Leave a note'}
        >
          <View style={styles.bubbleWrap}>
            <View
              style={[
                styles.bubble,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text variant="caption" color={ownNote ? 'primary' : 'tertiary'} numberOfLines={2}>
                {ownNote ? ownNote.text : 'Note…'}
              </Text>
            </View>
          </View>
          <Avatar uri={currentUser.avatarUrl ?? undefined} displayName={currentUser.displayName} size="lg" />
          <Text variant="caption" color="secondary" numberOfLines={1} style={styles.label}>
            {ownNote ? 'Your note' : 'Your note'}
          </Text>
        </Pressable>

        {/* Followed users' notes */}
        {otherNotes.map((note) => (
          <Pressable
            key={note.author.id}
            style={styles.item}
            onPress={() => handleOpenOther(note)}
            accessibilityRole="button"
            accessibilityLabel={`Note from ${note.author.username}: ${note.text}`}
          >
            <View style={styles.bubbleWrap}>
              <View
                style={[
                  styles.bubble,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Text variant="caption" color="primary" numberOfLines={2}>
                  {note.text}
                </Text>
              </View>
            </View>
            <Avatar uri={note.author.avatarUrl ?? undefined} displayName={note.author.displayName} size="lg" />
            <Text variant="caption" color="secondary" numberOfLines={1} style={styles.label}>
              {note.author.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Composer modal */}
      <Modal
        visible={composerOpen}
        transparent
        animationType="fade"
        onRequestClose={closeComposer}
      >
        <Pressable style={styles.backdrop} onPress={closeComposer}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text variant="bodyStrong" color="primary" align="center" style={{ marginBottom: theme.spacing.md }}>
              New note
            </Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Share a thought…"
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={NOTE_MAX_LENGTH}
              autoFocus
              multiline
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            />
            <Text variant="caption" color="tertiary" align="right" style={{ marginTop: theme.spacing.xxs }}>
              {draft.length}/{NOTE_MAX_LENGTH}
            </Text>

            <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
              <Button
                label="Share"
                variant="primary"
                size="md"
                fullWidth
                loading={setNote.isPending}
                disabled={draft.trim().length === 0 || setNote.isPending}
                onPress={handleShare}
                accessibilityLabel="Share note"
              />
              {ownNote ? (
                <Button
                  label="Delete note"
                  variant="ghost"
                  size="md"
                  fullWidth
                  loading={clearNote.isPending}
                  onPress={handleClear}
                  accessibilityLabel="Delete your note"
                />
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  scrollContent: {
    gap: 16,
    alignItems: 'flex-start',
  },
  item: {
    width: BUBBLE_MAX_WIDTH,
    alignItems: 'center',
  },
  bubbleWrap: {
    minHeight: 34,
    justifyContent: 'flex-end',
    marginBottom: -6,
    zIndex: 1,
  },
  bubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  label: {
    marginTop: 4,
    maxWidth: BUBBLE_MAX_WIDTH,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 20,
    padding: 20,
  },
  input: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
