/**
 * Lumina — SelectedMediaPreview
 *
 * Horizontal strip of selected media thumbnails shown in Step 2 (Details).
 * When only one item is selected it renders as a larger featured preview.
 * Works for both mock-grid tiles and real react-native-image-picker results
 * via the unified SelectedMedia shape — images render through @/components/Image,
 * videos render as a dark tile with a play icon and duration label.
 * Memoized — re-renders only when the media list changes.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image } from '@/components/Image';

import { useTheme, Text } from '@/design-system';
import { screen } from '@/constants/layout';
import { formatDuration } from '@/utils/format';
import type { SelectedMedia } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectedMediaPreviewProps {
  media: SelectedMedia[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SINGLE_PREVIEW_HEIGHT = screen.width * 0.55;
const STRIP_HEIGHT = 80;
const STRIP_ITEM_WIDTH = 80;
const STRIP_GAP = 4;

// ---------------------------------------------------------------------------
// VideoTile — dark poster fallback with play icon + duration
// ---------------------------------------------------------------------------

interface VideoTileProps {
  durationMs: number | undefined;
  iconSize: number;
}

const VideoTile = React.memo(function VideoTile({
  durationMs,
  iconSize,
}: VideoTileProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        styles.videoTile,
        { backgroundColor: theme.colors.overlay },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Ionicons name="play-circle" size={iconSize} color="white" />
      {durationMs !== undefined ? (
        <Text
          variant="overline"
          color="inverse"
          style={styles.durationLabel}
        >
          {formatDuration(durationMs)}
        </Text>
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Single-item large preview
// ---------------------------------------------------------------------------

interface SinglePreviewProps {
  item: SelectedMedia;
}

const SinglePreview = React.memo(function SinglePreview({
  item,
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
        source={{ uri: item.uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        recyclingKey={item.id}
        transition={200}
        accessibilityLabel={item.kind === 'video' ? 'Selected video preview' : 'Selected photo preview'}
        accessibilityRole="image"
      />
      {item.kind === 'video' ? (
        <VideoTile durationMs={item.durationMs} iconSize={56} />
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Strip item (multi-select)
// ---------------------------------------------------------------------------

interface StripItemProps {
  item: SelectedMedia;
  orderIndex: number;
}

const StripItem = React.memo(function StripItem({
  item,
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
        source={{ uri: item.uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        recyclingKey={`strip-${item.id}`}
        transition={120}
        accessibilityLabel={`Selected ${item.kind === 'video' ? 'video' : 'photo'} ${orderIndex + 1}`}
        accessibilityRole="image"
      />
      {item.kind === 'video' ? (
        <VideoTile durationMs={item.durationMs} iconSize={24} />
      ) : null}
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
  media,
}: SelectedMediaPreviewProps): React.JSX.Element | null {
  if (media.length === 0) return null;

  // Single item — large preview
  if (media.length === 1) {
    const item = media[0];
    if (!item) return null;
    return <SinglePreview item={item} />;
  }

  // Multiple items — horizontal strip
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.stripContent}
      accessibilityLabel={`${media.length} selected media items`}
      accessibilityRole="scrollbar"
    >
      {media.map((item, idx) => (
        <StripItem key={item.id} item={item} orderIndex={idx} />
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
  videoTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationLabel: {
    marginTop: 4,
    fontWeight: '700',
  },
});
