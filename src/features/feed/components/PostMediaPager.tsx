/**
 * Lumina — PostMediaPager
 *
 * Horizontal swipeable pager for multi-media posts.
 * Single-media posts render their item directly without pager chrome.
 * Double-tap triggers the like callback with a heart pop animation.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  type ViewToken,
  type ListRenderItemInfo,
} from 'react-native';
import { Image } from '@/components/Image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/design-system/theme';
import { screen, feedMediaHeight } from '@/constants/layout';
import type { Media } from '@/types/models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostMediaPagerProps {
  media: Media[];
  onDoubleTapLike: () => void;
  /** Pass the external liked state so the heart shows only when not already liked */
  isLiked: boolean;
}

// ---------------------------------------------------------------------------
// Heart pop overlay
// ---------------------------------------------------------------------------

function HeartOverlay({ scale }: { scale: Animated.SharedValue<number> }): React.JSX.Element {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 0.05 ? 1 : 0,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.heartOverlay, animatedStyle]}
      pointerEvents="none"
    >
      <Ionicons name="heart" size={80} color="white" />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Single media item
// ---------------------------------------------------------------------------

interface MediaItemProps {
  item: Media;
  width: number;
  height: number;
}

const MediaItem = React.memo(function MediaItem({
  item,
  width,
  height,
}: MediaItemProps): React.JSX.Element {
  const uri =
    item.type === 'video' ? (item.thumbnailUri ?? item.uri) : item.uri;

  return (
    <Image
      source={{ uri }}
      style={{ width, height }}
      contentFit="cover"
      accessibilityRole="image"
      accessibilityLabel={item.type === 'video' ? 'Video post thumbnail' : 'Post image'}
      transition={200}
    />
  );
});

// ---------------------------------------------------------------------------
// Dot indicators
// ---------------------------------------------------------------------------

function PagerDots({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i === activeIndex
                  ? theme.colors.accent
                  : theme.colors.border,
              width: i === activeIndex ? 8 : 5,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PostMediaPager
// ---------------------------------------------------------------------------

export const PostMediaPager = React.memo(function PostMediaPager({
  media,
  onDoubleTapLike,
  isLiked,
}: PostMediaPagerProps): React.JSX.Element {
  const heartScale = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Media>>(null);
  void flatListRef; // used implicitly for type

  const mediaWidth = screen.width;
  const firstItem = media[0];
  const mediaHeight =
    firstItem !== undefined
      ? feedMediaHeight(
          firstItem.width > firstItem.height ? 'landscape' : 'portrait',
        )
      : feedMediaHeight('portrait');

  const triggerHeartPop = useCallback((): void => {
    heartScale.value = withSequence(
      withSpring(1, { damping: 10, stiffness: 300 }),
      withTiming(0, { duration: 600 }),
    );
  }, [heartScale]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(onDoubleTapLike)();
      if (!isLiked) {
        runOnJS(triggerHeartPop)();
      }
    });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index !== null && first?.index !== undefined) {
        setActiveIndex(first.index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Media>) => (
      <MediaItem item={item} width={mediaWidth} height={mediaHeight} />
    ),
    [mediaWidth, mediaHeight],
  );

  const keyExtractor = useCallback(
    (_item: Media, index: number) => String(index),
    [],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<Media> | null | undefined, index: number) => ({
      length: mediaWidth,
      offset: mediaWidth * index,
      index,
    }),
    [mediaWidth],
  );

  return (
    <GestureDetector gesture={doubleTap}>
      <View style={{ width: mediaWidth, height: mediaHeight }}>
        <FlatList
          ref={flatListRef}
          data={media}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          scrollEnabled={media.length > 1}
          bounces={false}
          removeClippedSubviews
          accessibilityRole="none"
        />
        {/* Heart pop overlay */}
        <HeartOverlay scale={heartScale} />
        {/* Dot indicators — only show for multi-media posts */}
        {media.length > 1 ? (
          <PagerDots count={media.length} activeIndex={activeIndex} />
        ) : null}
        {/* Video badge */}
        {firstItem?.type === 'video' ? (
          <View style={styles.videoBadge}>
            <Ionicons name="play-circle" size={28} color="white" />
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  heartOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    height: 5,
    borderRadius: 9999,
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
