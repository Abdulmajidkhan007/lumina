/**
 * Lumina — HighlightComposer
 *
 * One screen for a new highlight: pick stories from your archive (in order)
 * → name → cover (one of the picked stories) → Save. Loading / empty /
 * error states for the archive; inline validation for the draft.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { Text } from '@/design-system/primitives/Text';
import { Button } from '@/design-system/primitives/Button';
import { Spinner } from '@/design-system/primitives/Spinner';
import { Image } from '@/components/Image';
import { useStoryArchive } from '@/data/query/hooks/useStoryArchive';
import { useCreateHighlight } from '@/data/query/hooks/useCreateHighlight';
import { HIGHLIGHT_TITLE_MAX } from '@/schemas';
import type { Story } from '@/types/models';
import {
  buildHighlightInput,
  resolveCoverId,
  storyPreviewUri,
  toggleStorySelection,
  type HighlightDraftError,
} from '@/features/stories/utils/highlightDraft';

const COLUMNS = 3;
const TILE_GAP = 2;
const COVER_SIZE = 56;
const SELECTED_BADGE = 22;
const ON_MEDIA = '#FFFFFF';
const MEDIA_SCRIM = 'rgba(0,0,0,0.25)';

export interface HighlightComposerProps {
  visible: boolean;
  onClose: () => void;
}

export function HighlightComposer({ visible, onClose }: HighlightComposerProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const archive = useStoryArchive(visible);
  const createHighlight = useCreateHighlight();

  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [coverId, setCoverId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<HighlightDraftError | null>(null);

  const stories = useMemo(() => archive.data ?? [], [archive.data]);
  const tileSize = (width - TILE_GAP * (COLUMNS - 1)) / COLUMNS;
  const effectiveCover = resolveCoverId(selected, coverId);
  const selectedStories = useMemo(
    () => selected.map((id) => stories.find((s) => s.id === id)).filter((s): s is Story => s !== undefined),
    [selected, stories],
  );

  const reset = useCallback(() => {
    setSelected([]);
    setTitle('');
    setCoverId(null);
    setDraftError(null);
    createHighlight.reset();
  }, [createHighlight]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleToggle = useCallback((id: string) => {
    setDraftError(null);
    setSelected((prev) => toggleStorySelection(prev, id));
  }, []);

  const handleSave = useCallback(() => {
    const draft = buildHighlightInput(title, stories, selected, coverId);
    if (!draft.ok) {
      setDraftError(draft.error);
      return;
    }
    createHighlight.mutate(draft.input, { onSuccess: handleClose });
  }, [title, stories, selected, coverId, createHighlight, handleClose]);

  const renderTile = useCallback(
    ({ item, index }: { item: Story; index: number }) => {
      const order = selected.indexOf(item.id);
      const isSelected = order >= 0;
      return (
        <Pressable
          onPress={() => handleToggle(item.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={new Date(item.createdAt).toLocaleDateString()}
          style={{
            width: tileSize,
            height: tileSize * 1.5,
            marginLeft: index % COLUMNS === 0 ? 0 : TILE_GAP,
            marginBottom: TILE_GAP,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Image source={{ uri: storyPreviewUri(item) }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          {isSelected ? <View style={[StyleSheet.absoluteFillObject, { backgroundColor: MEDIA_SCRIM }]} /> : null}
          {item.media.type === 'video' ? (
            <Ionicons name="videocam" size={16} color={ON_MEDIA} style={styles.videoBadge} />
          ) : null}
          <View
            style={[
              styles.selectBadge,
              {
                borderColor: ON_MEDIA,
                backgroundColor: isSelected ? theme.colors.accent : 'transparent',
              },
            ]}
          >
            {isSelected ? (
              <Text variant="caption" style={styles.onMedia}>
                {order + 1}
              </Text>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [selected, tileSize, theme.colors.surface, theme.colors.accent, handleToggle],
  );

  let archiveBody: React.ReactNode;
  if (archive.isLoading) {
    archiveBody = (
      <View style={[styles.state, { padding: theme.spacing['2xl'] }]}>
        <Spinner size="md" />
      </View>
    );
  } else if (archive.isError) {
    archiveBody = (
      <View style={[styles.state, { padding: theme.spacing.xl, gap: theme.spacing.md }]}>
        <Text variant="callout" color="secondary" align="center">
          {t('highlights.archiveError')}
        </Text>
        <Button label={t('common.retry')} variant="secondary" size="sm" onPress={() => void archive.refetch()} />
      </View>
    );
  } else if (stories.length === 0) {
    archiveBody = (
      <View style={[styles.state, { padding: theme.spacing.xl, gap: theme.spacing.xs }]}>
        <Ionicons name="time-outline" size={36} color={theme.colors.textTertiary} />
        <Text variant="bodyStrong" color="primary" align="center">
          {t('highlights.archiveEmpty')}
        </Text>
        <Text variant="caption" color="secondary" align="center">
          {t('highlights.archiveEmptyHint')}
        </Text>
      </View>
    );
  } else {
    archiveBody = (
      <FlatList
        data={stories}
        keyExtractor={(s) => s.id}
        renderItem={renderTile}
        numColumns={COLUMNS}
        scrollEnabled={false}
      />
    );
  }

  const errorText =
    draftError === 'noStories'
      ? t('highlights.needStories')
      : draftError === 'noTitle'
        ? t('highlights.needName')
        : createHighlight.isError
          ? t('highlights.saveError')
          : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        {/* Header: Cancel · title · Save */}
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.colors.border, paddingHorizontal: theme.spacing.lg },
          ]}
        >
          <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel={t('highlights.cancel')}>
            <Text variant="callout" color="primary">
              {t('highlights.cancel')}
            </Text>
          </Pressable>
          <Text variant="bodyStrong" color="primary">
            {t('highlights.newTitle')}
          </Text>
          {createHighlight.isPending ? (
            <Spinner size="sm" />
          ) : (
            <Pressable onPress={handleSave} accessibilityRole="button" accessibilityLabel={t('highlights.save')}>
              <Text variant="bodyStrong" color="accent">
                {t('highlights.save')}
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: theme.spacing['2xl'] }}>
          {/* Name + cover */}
          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
            <TextInput
              value={title}
              onChangeText={(v) => {
                setDraftError(null);
                setTitle(v);
              }}
              placeholder={t('highlights.namePlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={HIGHLIGHT_TITLE_MAX}
              accessibilityLabel={t('highlights.name')}
              style={[
                styles.input,
                theme.typography.body,
                {
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.md,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md,
                },
              ]}
            />

            {selectedStories.length > 0 ? (
              <View style={{ gap: theme.spacing.xs }}>
                <Text variant="caption" color="secondary">
                  {t('highlights.cover')} · {t('highlights.coverHint')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
                  {selectedStories.map((s) => {
                    const isCover = s.id === effectiveCover;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setCoverId(s.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isCover }}
                        accessibilityLabel={t('highlights.cover')}
                        style={[
                          styles.coverRing,
                          { borderColor: isCover ? theme.colors.accent : 'transparent' },
                        ]}
                      >
                        <Image source={{ uri: storyPreviewUri(s) }} style={styles.cover} contentFit="cover" />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {errorText ? (
              <Text variant="caption" color="danger">
                {errorText}
              </Text>
            ) : null}
          </View>

          {/* Archive grid */}
          <View
            style={[styles.sectionRow, { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }]}
          >
            <Text variant="bodyStrong" color="primary">
              {t('highlights.pickStories')}
            </Text>
            {selected.length > 0 ? (
              <Text variant="caption" color="secondary">
                {t('highlights.selectedCount', { count: selected.length })}
              </Text>
            ) : null}
          </View>
          {archiveBody}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
  },
  selectBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: SELECTED_BADGE,
    height: SELECTED_BADGE,
    borderRadius: SELECTED_BADGE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onMedia: {
    color: ON_MEDIA,
    fontWeight: '700',
  },
  coverRing: {
    borderWidth: 2,
    borderRadius: COVER_SIZE / 2 + 4,
    padding: 2,
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: COVER_SIZE / 2,
  },
});
