/**
 * Lumina — PostMediaPager
 *
 * Horizontal swipeable pager for multi-media posts.
 * Single-media posts render their item directly without pager chrome.
 * Double-tap triggers the like callback with a heart pop animation.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type ViewToken,
  type ListRenderItemInfo,
} from 'react-native';
import { Image } from '@/components/Image';
import { VideoPlayer } from '@/components/VideoPlayer';
import { FlatList, Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  /** Long-press opens the share/quick-actions sheet. */
  onLongPress?: () => void;
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
  /** Whether this item is the one currently shown in the pager. */
  isActive: boolean;
}

const MediaItem = React.memo(function MediaItem({
  item,
  width,
  height,
  isActive,
}: MediaItemProps): React.JSX.Element {
  const [userPaused, setUserPaused] = useState(false);

  if (item.type === 'video') {
    // Real playback (muted + looping, like Instagram); autoplays when this
    // page is active. Tapping toggles play/pause. Renders the poster until
    // the first frame is ready. Fixes videos showing blank in the feed.
    return (
      <Pressable
        onPress={() => setUserPaused((p) => !p)}
        style={{ width, height }}
        accessibilityRole="button"
        accessibilityLabel="Video post — tap to play or pause"
      >
        <VideoPlayer
          uri={item.uri}
          paused={!isActive || userPaused}
          muted
          repeat
          resizeMode="cover"
          posterUri={item.thumbnailUri}
          style={{ width, height }}
        />
      </Pressable>
    );
  }

  return (
    <Image
      source={{ uri: item.uri }}
      style={{ width, height }}
      contentFit="cover"
      accessibilityRole="image"
      accessibilityLabel="Post image"
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
  onLongPress,
}: PostMediaPagerProps): React.JSX.Element {
  const heartScale = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => {
      if (onLongPress) runOnJS(onLongPress)();
    });

  const composedGesture = Gesture.Race(doubleTap, longPress);

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
    ({ item, index }: ListRenderItemInfo<Media>) => (
      <MediaItem
        item={item}
        width={mediaWidth}
        height={mediaHeight}
        isActive={index === activeIndex}
      />
    ),
    [mediaWidth, mediaHeight, activeIndex],
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
    <GestureDetector gesture={composedGesture}>
      <View style={{ width: mediaWidth, height: mediaHeight }}>
        <FlatList
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
});
