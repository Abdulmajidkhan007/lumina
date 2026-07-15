/**
 * Lumina — Create Post feature types
 *
 * Zod schema + inferred type for the caption form, plus the SelectedMedia
 * type that unifies mock gallery tiles (fallback grid) and real
 * react-native-image-picker results under one shape so the rest of the
 * create-post flow (preview, caption step, share) doesn't need to care
 * where a piece of media came from.
 */

import { z } from 'zod';
import { Config } from '@/constants/config';
import type { MockMediaTile } from './components/MediaPickerGrid';
import type { MediaKind, PickedMedia } from './hooks/useMediaPicker';

// ---------------------------------------------------------------------------
// Caption form schema
// ---------------------------------------------------------------------------

export const createPostSchema = z.object({
  caption: z
    .string()
    .max(Config.MAX_CAPTION_LENGTH, {
      message: `Caption cannot exceed ${Config.MAX_CAPTION_LENGTH} characters`,
    })
    .default(''),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;

// ---------------------------------------------------------------------------
// SelectedMedia — unifies MockMediaTile and PickedMedia
// ---------------------------------------------------------------------------

export type SelectedMediaSource = 'mock' | 'picker';

export interface SelectedMedia {
  /** Stable key: the mock tile id, or a generated id for picker-sourced media. */
  id: string;
  uri: string;
  kind: MediaKind;
  width?: number;
  height?: number;
  /** Video duration in milliseconds; undefined for images. */
  durationMs?: number;
  source: SelectedMediaSource;
}

let pickerMediaSeq = 0;

/** Maps a mock gallery tile (always a static image) into the unified shape. */
export function mockTileToSelectedMedia(tile: MockMediaTile): SelectedMedia {
  return {
    id: tile.id,
    uri: tile.uri,
    kind: 'image',
    source: 'mock',
  };
}

/** Maps a react-native-image-picker result into the unified shape. */
export function pickedMediaToSelectedMedia(picked: PickedMedia): SelectedMedia {
  pickerMediaSeq += 1;
  return {
    id: `picker-${Date.now()}-${pickerMediaSeq}`,
    uri: picked.uri,
    kind: picked.type,
    width: picked.width,
    height: picked.height,
    durationMs: picked.durationMs,
    source: 'picker',
  };
}
