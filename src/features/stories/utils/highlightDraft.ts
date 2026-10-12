/**
 * Lumina — highlight draft helpers (pure, unit-tested).
 *
 * A highlight is built from archived stories: pick stories → name → cover
 * (one of the picked ones) → save. These helpers keep the selection rules
 * out of the UI.
 */
import { HIGHLIGHT_TITLE_MAX } from '@/schemas';
import type { CreateHighlightInput, HighlightMediaInput } from '@/data/api/contracts';
import type { Story } from '@/types/models';

/** Story media as highlight input — already uploaded, so nothing re-uploads. */
export function storyToHighlightMedia(story: Story): HighlightMediaInput {
  const { media } = story;
  return media.type === 'video'
    ? {
        uri: media.uri,
        type: 'video',
        width: media.width,
        height: media.height,
        ...(media.durationMs !== undefined ? { durationMs: media.durationMs } : {}),
      }
    : { uri: media.uri, type: 'image', width: media.width, height: media.height };
}

/** Image shown for a story in pickers and as a cover (video → its poster). */
export function storyPreviewUri(story: Story): string {
  return story.media.type === 'video' ? story.media.thumbnailUri ?? story.media.uri : story.media.uri;
}

/** Toggles a story in the ordered selection (order = highlight order). */
export function toggleStorySelection(selected: readonly string[], storyId: string): string[] {
  return selected.includes(storyId) ? selected.filter((id) => id !== storyId) : [...selected, storyId];
}

/** The cover stays the chosen story while it's selected, else falls back to the first pick. */
export function resolveCoverId(selected: readonly string[], coverId: string | null): string | null {
  if (coverId && selected.includes(coverId)) return coverId;
  return selected[0] ?? null;
}

export type HighlightDraftError = 'noStories' | 'noTitle';

/**
 * Builds the create input from the draft, or says what is missing. Stories
 * keep the user's pick order; the cover is a picked story's preview.
 */
export function buildHighlightInput(
  title: string,
  stories: readonly Story[],
  selectedIds: readonly string[],
  coverId: string | null,
): { ok: true; input: CreateHighlightInput } | { ok: false; error: HighlightDraftError } {
  const byId = new Map(stories.map((s) => [s.id as string, s]));
  const picked = selectedIds.map((id) => byId.get(id)).filter((s): s is Story => s !== undefined);
  if (picked.length === 0) return { ok: false, error: 'noStories' };
  const trimmed = title.trim().slice(0, HIGHLIGHT_TITLE_MAX);
  if (trimmed.length === 0) return { ok: false, error: 'noTitle' };
  const cover = byId.get(resolveCoverId(selectedIds, coverId) ?? '') ?? picked[0]!;
  return {
    ok: true,
    input: { title: trimmed, media: picked.map(storyToHighlightMedia), coverUri: storyPreviewUri(cover) },
  };
}
