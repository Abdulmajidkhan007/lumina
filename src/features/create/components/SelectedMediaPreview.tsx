/**
 * Lumina — SelectedMediaPreview
 *
 * Horizontal strip of selected media thumbnails shown in Step 2 (Details).
 * When only one item is selected it renders as a larger featured preview.
 * Memoized — re-renders only when selectedIds/tiles change.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/design-system';
import { screen } from '@/constants/layout';
import type { MockMediaTile } from './MediaPickerGrid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectedMediaPreviewProps {
  tiles: MockMediaTile[];
  selectedIds: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SINGLE_PREVIEW_HEIGHT = screen.width * 0.55;
const STRIP_HEIGHT = 80;
const STRIP_ITEM_WIDTH = 80;
const STRIP_GAP = 4;

// ---------------------------------------------------------------------------
// Single-item large preview
// ---------------------------------------------------------------------------

interface SinglePreviewProps {
  tile: MockMediaTile;
}

const SinglePreview = React.memo(function SinglePreview({
  tile,
}: SinglePreviewProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.singleWrapper,
        {
          height: SINGLE_PREVIEW_HEIGHT,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Image
        source={{ uri: tile.uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        recyclingKey={tile.id}
        transition={200}
        accessibilityLabel="Selected photo preview"
        accessibilityRole="image"
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Strip item (multi-select)
// ---------------------------------------------------------------------------

interface StripItemProps {
  tile: MockMediaTile;
  orderIndex: number;
}

const StripItem = React.memo(function StripItem({
  tile,
  orderIndex,
}: StripItemProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.stripItem,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Image
        source={{ uri: tile.uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        recyclingKey={`strip-${tile.id}`}
        transition={120}
        accessibilityLabel={`Selected photo ${orderIndex + 1}`}
        accessibilityRole="image"
      />
      {/* Order badge */}
      <View
        style={[
          styles.orderBadge,
          { backgroundColor: theme.colors.accent },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// SelectedMediaPreview
// ---------------------------------------------------------------------------

export const SelectedMediaPreview = React.memo(function SelectedMediaPreview({
  tiles,
  selectedIds,
}: SelectedMediaPreviewProps): React.JSX.Element | null {
  if (selectedIds.length === 0) return null;

  const orderedTiles = selectedIds
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is MockMediaTile => t !== undefined);

  if (orderedTiles.length === 0) return null;

  // Single item — large preview
  if (orderedTiles.length === 1) {
    const tile = orderedTiles[0];
    if (!tile) return null;
    return <SinglePreview tile={tile} />;
  }

  // Multiple items — horizontal strip
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.stripContent}
      accessibilityLabel={`${orderedTiles.length} selected photos`}
      accessibilityRole="scrollbar"
    >
      {orderedTiles.map((tile, idx) => (
        <StripItem key={tile.id} tile={tile} orderIndex={idx} />
      ))}
    </ScrollView>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  singleWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  strip: {
    height: STRIP_HEIGHT,
    flexGrow: 0,
  },
  stripContent: {
    paddingHorizontal: 12,
    gap: STRIP_GAP,
    alignItems: 'center',
  },
  stripItem: {
    width: STRIP_ITEM_WIDTH,
    height: STRIP_ITEM_WIDTH,
    borderRadius: 6,
    overflow: 'hidden',
  },
  orderBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
