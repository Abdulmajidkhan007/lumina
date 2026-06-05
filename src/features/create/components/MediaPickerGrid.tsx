/**
 * Lumina — MediaPickerGrid
 *
 * 3-column grid of mock gallery thumbnails backed by picsum.photos seeds.
 * Tapping a cell selects/deselects it (supports multi-select up to
 * Config.MAX_POST_MEDIA_COUNT). Order-badges appear in selection order.
 * Each cell is memoized; the press handler is stable via useCallback.
 *
 * // TODO expo-image-picker: replace mock tiles with MediaLibrary assets.
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useTheme , Text } from '@/design-system';
import { grid } from '@/constants/layout';
import { Config } from '@/constants/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockMediaTile {
  /** Stable unique key */
  id: string;
  uri: string;
  aspectRatio: number;
}

export interface MediaPickerGridProps {
  tiles: MockMediaTile[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const NUM_COLUMNS = 3;
const GAP = grid.columnGap;
const CELL_SIZE = grid.profileCellWidth;

// ---------------------------------------------------------------------------
// GridCell — memoized tile
// ---------------------------------------------------------------------------

interface GridCellProps {
  tile: MockMediaTile;
  selectionIndex: number; // -1 = not selected
  onPress: (id: string) => void;
}

const GridCell = React.memo(function GridCell({
  tile,
  selectionIndex,
  onPress,
}: GridCellProps): React.JSX.Element {
  const theme = useTheme();
  const isSelected = selectionIndex !== -1;

  const handlePress = useCallback(() => {
    onPress(tile.id);
  }, [onPress, tile.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.cell}
      accessibilityRole="checkbox"
      accessibilityLabel={`Gallery photo ${tile.id}`}
      accessibilityState={{ checked: isSelected }}
    >
      <Image
        source={{ uri: tile.uri }}
        style={styles.cellImage}
        contentFit="cover"
        recyclingKey={tile.id}
        transition={120}
        accessibilityRole="image"
        accessibilityLabel="Gallery thumbnail"
      />

      {/* Dim overlay when selected */}
      {isSelected ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.selectedOverlay,
            { backgroundColor: theme.colors.overlay },
          ]}
          pointerEvents="none"
        />
      ) : null}

      {/* Selection badge — order number or checkmark for single */}
      <View
        style={[
          styles.badge,
          isSelected
            ? {
                backgroundColor: theme.colors.accent,
                borderColor: theme.colors.accent,
              }
            : {
                backgroundColor: 'transparent',
                borderColor: theme.colors.surface,
              },
        ]}
        pointerEvents="none"
      >
        {isSelected ? (
          <Text
            variant="overline"
            style={[styles.badgeText, { color: theme.colors.surface }]}
          >
            {selectionIndex + 1}
          </Text>
        ) : (
          <Ionicons
            name="ellipse-outline"
            size={20}
            color={theme.colors.surface}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// MediaPickerGrid
// ---------------------------------------------------------------------------

export const MediaPickerGrid = React.memo(function MediaPickerGrid({
  tiles,
  selectedIds,
  onToggle,
}: MediaPickerGridProps): React.JSX.Element {
  const theme = useTheme();

  const selectionMap = React.useMemo(() => {
    const map = new Map<string, number>();
    selectedIds.forEach((id, idx) => map.set(id, idx));
    return map;
  }, [selectedIds]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<MockMediaTile>) => {
      const selectionIndex = selectionMap.get(item.id) ?? -1;
      return (
        <GridCell
          tile={item}
          selectionIndex={selectionIndex}
          onPress={onToggle}
        />
      );
    },
    [selectionMap, onToggle],
  );

  const keyExtractor = useCallback(
    (item: MockMediaTile) => item.id,
    [],
  );

  return (
    <FlatList<MockMediaTile>
      data={tiles}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.columnWrapper}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      windowSize={5}
      maxToRenderPerBatch={9}
      initialNumToRender={15}
      style={[styles.list, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        selectedIds.length >= Config.MAX_POST_MEDIA_COUNT ? (
          <View
            style={[
              styles.limitBanner,
              {
                backgroundColor: theme.colors.surface,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.xs,
              },
            ]}
          >
            <Text variant="caption" color="secondary" align="center">
              You can select up to {Config.MAX_POST_MEDIA_COUNT} photos or videos.
            </Text>
          </View>
        ) : null
      }
    />
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  columnWrapper: {
    gap: GAP,
    marginBottom: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    overflow: 'hidden',
  },
  cellImage: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  selectedOverlay: {
    opacity: 0.35,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '700',
  },
  limitBanner: {
    // rendered as ListHeaderComponent
  },
});
