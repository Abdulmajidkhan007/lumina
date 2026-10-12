/**
 * Lumina — PostMediaPager
 *
 * Horizontal swipeable pager for multi-media posts.
 * Single-media posts render their item directly without pager chrome.
 * Double-tap triggers the like callback with a heart pop animation.
 *
 * Videos autoplay only while the post is the most-visible one in the feed
 * (viewability, `feedActive`), the screen is focused and the app is in the
 * foreground. Tap = pause/resume, global speaker toggle (same as Reels),
 * thin progress line at the bottom.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { useVideoMuted } from '@/stores/preferences.store';
import {
  MuteButton,
  PlaybackIndicator,
  VideoProgressBar,
  playbackFraction,
  usePlaybackAllowed,
} from '@/components/video';
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
  /** True when this post is the most-visible one in the feed (video autoplay). */
  feedActive?: boolean;
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
  /** User tapped to pause (owned by the pager so double-tap can't toggle it). */
  userPaused: boolean;
}

const VideoItem = React.memo(function VideoItem({
  item,
  width,
  height,
  isActive,
  userPaused,
}: MediaItemProps & { item: Extract<Media, { type: 'video' }> }): React.JSX.Element {
  const playbackAllowed = usePlaybackAllowed();
  const muted = useVideoMuted();
  const progress = useSharedValue(0);
  const durationRef = useRef(0);

  const handleLoad = useCallback((durationMs: number) => {
    durationRef.current = durationMs;
  }, []);
  const handleProgress = useCallback(
    (positionMs: number) => {
      progress.value = withTiming(playbackFraction(positionMs, durationRef.current), { duration: 250 });
    },
    [progress],
  );

  return (
    <View style={{ width, height }}>
      <VideoPlayer
        uri={item.uri}
        paused={!isActive || userPaused || !playbackAllowed}
        muted={muted}
        repeat
        resizeMode="cover"
        posterUri={item.thumbnailUri}
        onLoad={handleLoad}
        onProgress={handleProgress}
        style={{ width, height }}
      />
      {isActive ? (
        <>
          <PlaybackIndicator paused={userPaused} size={60} />
          <VideoProgressBar progress={progress} />
        </>
      ) : null}
    </View>
  );
});

const MediaItem = React.memo(function MediaItem(props: MediaItemProps): React.JSX.Element {
  const { item, width, height } = props;
  if (item.type === 'video') return <VideoItem {...props} item={item} />;

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
  feedActive = true,
}: PostMediaPagerProps): React.JSX.Element {
  const heartScale = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);

  // Scrolling away and back (or swiping pages) resumes playback.
  useEffect(() => {
    setVideoPaused(false);
  }, [feedActive, activeIndex]);

  const activeIsVideo = media[activeIndex]?.type === 'video';
  const toggleVideoPaused = useCallback(() => setVideoPaused((p) => !p), []);

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
    .maxDelay(250)
    .onEnd((_e, success) => {
      if (!success) return;
      runOnJS(onDoubleTapLike)();
      if (!isLiked) {
        runOnJS(triggerHeartPop)();
      }
    });

  // Single tap pauses/resumes a video — only after a double-tap is ruled out.
  const singleTap = Gesture.Tap()
    .enabled(activeIsVideo)
    .onEnd((_e, success) => {
      if (success) runOnJS(toggleVideoPaused)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => {
      if (onLongPress) runOnJS(onLongPress)();
    });

  const composedGesture = Gesture.Race(longPress, Gesture.Exclusive(doubleTap, singleTap));

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
        isActive={index === activeIndex && feedActive}
        userPaused={videoPaused}
      />
    ),
    [mediaWidth, mediaHeight, activeIndex, feedActive, videoPaused],
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
    <View style={{ width: mediaWidth, height: mediaHeight }}>
      <GestureDetector gesture={composedGesture}>
        <View style={StyleSheet.absoluteFillObject}>
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
      {/* Outside the gesture area so a tap on it never also pauses the video */}
      {activeIsVideo && feedActive ? <MuteButton size={30} style={styles.muteButton} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  muteButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
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
