/**
 * Lumina — useMockGalleryTiles
 *
 * Returns a stable list of mock gallery tiles backed by picsum.photos.
 * The array is memoized at module level — it never changes between renders.
 *
 * // TODO expo-image-picker: replace with MediaLibrary.getAssetsAsync()
 *   and map each MediaLibrary.Asset to MockMediaTile.
 */

import { useMemo } from 'react';
import type { MockMediaTile } from './components/MediaPickerGrid';

// ---------------------------------------------------------------------------
// Build mock tiles at module load time (stable reference)
// ---------------------------------------------------------------------------

const MOCK_TILE_COUNT = 60;

const MODULE_TILES: MockMediaTile[] = Array.from(
  { length: MOCK_TILE_COUNT },
  (_, i) => {
    const seed = `lumina-gallery-${i + 1}`;
    return {
      id: `tile-${i + 1}`,
      uri: `https://picsum.photos/seed/${seed}/400/400`,
      aspectRatio: 1,
    };
  },
);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMockGalleryTiles(): MockMediaTile[] {
  // Wrapped in useMemo to signal intent; MODULE_TILES is already stable.
  return useMemo(() => MODULE_TILES, []);
}
