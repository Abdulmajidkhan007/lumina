/**
 * Lumina — AddToHighlightButton
 *
 * "Highlight" pill shown on your own story. Opens a sheet listing your
 * highlights — tap one to add the current story — or create a new highlight
 * with this story as its cover. Playback pauses while the sheet is open.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Sheet } from '@/design-system/primitives/Sheet';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { Spinner } from '@/design-system/primitives/Spinner';
import { Image } from '@/components/Image';
import { hitSlop } from '@/constants/layout';
import { useHighlights } from '@/data/query/hooks/useHighlights';
import { useAddToHighlight } from '@/data/query/hooks/useAddToHighlight';
import { useCreateHighlight } from '@/data/query/hooks/useCreateHighlight';
import { useCurrentUser } from '@/stores/auth.store';
import { HIGHLIGHT_TITLE_MAX } from '@/schemas';
import type { Story, UserId } from '@/types/models';
import { buildHighlightInput, storyToHighlightMedia } from '../utils/highlightDraft';

const PILL_BG = 'rgba(0,0,0,0.35)';
const ON_MEDIA = '#FFFFFF';
const COVER = 48;

export interface AddToHighlightButtonProps {
  story: Story;
  /** Pauses the story while the sheet is open. */
  onOpenChange: (open: boolean) => void;
}

export function AddToHighlightButton({ story, onOpenChange }: AddToHighlightButtonProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const highlights = useHighlights((currentUser?.id ?? '') as UserId);
  const addToHighlight = useAddToHighlight();
  const createHighlight = useCreateHighlight();

  useEffect(() => onOpenChange(open), [open, onOpenChange]);

  const close = useCallback(() => {
    setOpen(false);
    setCreating(false);
    setTitle('');
    setDoneMessage(null);
    addToHighlight.reset();
    createHighlight.reset();
  }, [addToHighlight, createHighlight]);

  // Brief confirmation, then the sheet closes and the story resumes.
  useEffect(() => {
    if (!doneMessage) return;
    const timer = setTimeout(close, 900);
    return () => clearTimeout(timer);
  }, [doneMessage, close]);

  const addTo = useCallback(
    (highlightId: string, highlightTitle: string) => {
      addToHighlight.mutate(
        { highlightId, media: [storyToHighlightMedia(story)] },
        { onSuccess: () => setDoneMessage(t('highlights.added', { title: highlightTitle })) },
      );
    },
    [addToHighlight, story, t],
  );

  const createWithStory = useCallback(() => {
    const draft = buildHighlightInput(title, [story], [story.id], story.id);
    if (!draft.ok) return;
    createHighlight.mutate(draft.input, {
      onSuccess: (h) => setDoneMessage(t('highlights.added', { title: h.title })),
    });
  }, [title, story, createHighlight, t]);

  const busy = addToHighlight.isPending || createHighlight.isPending;
  const failed = addToHighlight.isError || createHighlight.isError;

  let list: React.ReactNode;
  if (highlights.isLoading) {
    list = (
      <View style={[styles.state, { padding: theme.spacing.lg }]}>
        <Spinner size="md" />
      </View>
    );
  } else if (highlights.isError) {
    list = (
      <View style={[styles.state, { padding: theme.spacing.lg, gap: theme.spacing.sm }]}>
        <Text variant="callout" color="secondary" align="center">
          {t('common.error')}
        </Text>
        <Button label={t('common.retry')} variant="secondary" size="sm" onPress={() => void highlights.refetch()} />
      </View>
    );
  } else {
    list = (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        {(highlights.data ?? []).map((h) => {
          const alreadyIn = h.media.some((m) => m.uri === story.media.uri);
          return (
            <Pressable
              key={h.id}
              disabled={alreadyIn || busy}
              onPress={() => addTo(h.id, h.title)}
              accessibilityRole="button"
              accessibilityLabel={alreadyIn ? `${h.title}. ${t('highlights.alreadyIn')}` : h.title}
              style={[styles.item, { opacity: alreadyIn ? 0.5 : 1 }]}
            >
              <View style={[styles.cover, { borderColor: theme.colors.border }]}>
                <Image source={{ uri: h.coverUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                {alreadyIn ? (
                  <View style={[StyleSheet.absoluteFillObject, styles.state]}>
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.accent} />
                  </View>
                ) : null}
              </View>
              <Text variant="caption" color="primary" numberOfLines={1} style={styles.itemLabel}>
                {h.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        accessibilityLabel={t('highlights.addToHighlightTitle')}
        style={[
          styles.pill,
          {
            backgroundColor: PILL_BG,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radii.full,
            gap: theme.spacing.xs,
          },
        ]}
      >
        <Ionicons name="heart-circle-outline" size={18} color={ON_MEDIA} />
        <Text variant="callout" style={styles.onMedia}>
          {t('highlights.addToHighlight')}
        </Text>
      </Pressable>

      <Sheet visible={open} onDismiss={close} maxHeightFraction={0.6}>
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="bodyStrong" color="primary" style={{ paddingHorizontal: theme.spacing.lg }}>
            {t('highlights.addToHighlightTitle')}
          </Text>

          {doneMessage ? (
            <View style={[styles.state, { padding: theme.spacing.lg, gap: theme.spacing.sm }]}>
              <Ionicons name="checkmark-circle" size={36} color={theme.colors.success} />
              <Text variant="callout" color="primary" align="center">
                {doneMessage}
              </Text>
            </View>
          ) : (
            <>
              {list}

              <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}>
                {creating ? (
                  <>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      autoFocus
                      placeholder={t('highlights.namePlaceholder')}
                      placeholderTextColor={theme.colors.textTertiary}
                      maxLength={HIGHLIGHT_TITLE_MAX}
                      accessibilityLabel={t('highlights.name')}
                      style={[
                        theme.typography.body,
                        styles.input,
                        {
                          color: theme.colors.textPrimary,
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radii.md,
                          padding: theme.spacing.md,
                        },
                      ]}
                    />
                    <Button
                      label={t('highlights.save')}
                      variant="primary"
                      size="md"
                      fullWidth
                      loading={createHighlight.isPending}
                      disabled={title.trim().length === 0 || busy}
                      onPress={createWithStory}
                    />
                  </>
                ) : (
                  <Button
                    label={t('highlights.createWithStory')}
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={() => setCreating(true)}
                  />
                )}
                {failed ? (
                  <Text variant="caption" color="danger">
                    {t('highlights.saveError')}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onMedia: {
    color: ON_MEDIA,
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    width: COVER + 16,
    alignItems: 'center',
  },
  cover: {
    width: COVER,
    height: COVER,
    borderRadius: COVER / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  itemLabel: {
    marginTop: 4,
    maxWidth: COVER + 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
