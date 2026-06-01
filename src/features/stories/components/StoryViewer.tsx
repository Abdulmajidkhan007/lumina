/**
 * Lumina — StoryViewer
 *
 * Fullscreen dark story viewer with:
 * - Segmented progress bars (Reanimated, auto-advance)
 * - Tap left/right to go prev/next
 * - Long-press to pause
 * - Swipe-down (PanGesture) to dismiss
 * - Author avatar + name + timestamp + close button
 * - expo-image for image stories; poster image for video (TODO: full video)
 * - Marks stories seen via storiesApi
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/design-system/theme';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';
import { formatRelativeTime } from '@/utils/format';
import { storiesApi } from '@/data/api/client';
import type { StoryReel } from '@/types/models';
import { StoryProgressBar } from './StoryProgressBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoryViewerProps {
  reel: StoryReel;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORY_DURATION_MS = 5000;
const SWIPE_DISMISS_THRESHOLD = 80;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryViewer({
  reel,
  onDismiss,
}: StoryViewerProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progress = useSharedValue(0);

  // Track elapsed before pause to resume from correct position
  const elapsedRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // Translated Y for swipe-down dismiss
  const translateY = useSharedValue(0);

  const story = reel.stories[storyIndex];

  // ---------------------------------------------------------------------------
  // Mark seen
  // ---------------------------------------------------------------------------

  const markSeen = useCallback(
    (idx: number) => {
      const s = reel.stories[idx];
      if (s != null && !s.seen) {
        void storiesApi.markSeen(s.id);
      }
    },
    [reel.stories],
  );

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const goNext = useCallback(() => {
    const nextIndex = storyIndex + 1;
    if (nextIndex < reel.stories.length) {
      elapsedRef.current = 0;
      progress.value = 0;
      setStoryIndex(nextIndex);
      markSeen(nextIndex);
    } else {
      onDismiss();
    }
  }, [storyIndex, reel.stories.length, progress, markSeen, onDismiss]);

  const goPrev = useCallback(() => {
    const prevIndex = storyIndex - 1;
    if (prevIndex >= 0) {
      elapsedRef.current = 0;
      progress.value = 0;
      setStoryIndex(prevIndex);
    }
  }, [storyIndex, progress]);

  // ---------------------------------------------------------------------------
  // Auto-advance timer using Reanimated timing
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isPaused) return;

    const remaining = STORY_DURATION_MS * (1 - progress.value);
    startTimeRef.current = Date.now();

    progress.value = withTiming(1, { duration: remaining }, (finished) => {
      if (finished) {
        runOnJS(goNext)();
      }
    });

    return () => {
      // Capture elapsed time for pause resume
      if (startTimeRef.current != null) {
        elapsedRef.current += Date.now() - startTimeRef.current;
      }
      cancelAnimation(progress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIndex, isPaused]);

  // Mark current story seen on mount/index change
  useEffect(() => {
    markSeen(storyIndex);
  }, [markSeen, storyIndex]);

  // ---------------------------------------------------------------------------
  // Gestures
  // ---------------------------------------------------------------------------

  // Long press — pause
  const longPress = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      runOnJS(setIsPaused)(true);
    })
    .onFinalize(() => {
      runOnJS(setIsPaused)(false);
    });

  // Swipe down to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > SWIPE_DISMISS_THRESHOLD || e.velocityY > 800) {
        runOnJS(onDismiss)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const composed = Gesture.Simultaneous(longPress, panGesture);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - translateY.value / (SCREEN_HEIGHT * 0.5),
  }));

  // ---------------------------------------------------------------------------
  // Tap zones
  // ---------------------------------------------------------------------------

  const handleLeftTap = useCallback(() => {
    cancelAnimation(progress);
    elapsedRef.current = 0;
    progress.value = 0;
    goPrev();
  }, [goPrev, progress]);

  const handleRightTap = useCallback(() => {
    cancelAnimation(progress);
    elapsedRef.current = 0;
    progress.value = 0;
    goNext();
  }, [goNext, progress]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (story == null) return <View style={styles.container} />;

  const mediaUri =
    story.media.type === 'video'
      ? (story.media.thumbnailUri ?? story.media.uri)
      : story.media.uri;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Background media */}
        <Image
          source={{ uri: mediaUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={100}
          accessibilityLabel="Story image"
        />

        {/* Dark gradient overlay at top/bottom */}
        <View style={styles.topGradient} pointerEvents="none" />
        <View style={styles.bottomGradient} pointerEvents="none" />

        {/* Top chrome: progress bars + author header */}
        <View
          style={[
            styles.topChrome,
            { paddingTop: insets.top + theme.spacing.sm },
          ]}
        >
          {/* Progress bars */}
          <View
            style={[
              styles.progressRow,
              { paddingHorizontal: theme.spacing.sm },
            ]}
          >
            <StoryProgressBar
              count={reel.stories.length}
              activeIndex={storyIndex}
              progress={progress}
            />
          </View>

          {/* Author row */}
          <View
            style={[
              styles.authorRow,
              { paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.sm },
            ]}
          >
            <Avatar
              uri={reel.author.avatarUrl ?? undefined}
              displayName={reel.author.displayName}
              size="sm"
              accessibilityLabel={`${reel.author.displayName}'s avatar`}
            />
            <View style={styles.authorInfo}>
              <Text variant="bodyStrong" color="inverse">
                {reel.author.username}
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {formatRelativeTime(story.createdAt)}
              </Text>
            </View>

            {/* Pause indicator */}
            {isPaused ? (
              <Ionicons
                name="pause"
                size={20}
                color="rgba(255,255,255,0.8)"
                style={{ marginRight: theme.spacing.sm }}
              />
            ) : null}

            {/* Video badge */}
            {story.media.type === 'video' ? (
              <Ionicons
                name="play-circle-outline"
                size={18}
                color="rgba(255,255,255,0.8)"
                style={{ marginRight: theme.spacing.sm }}
              />
            ) : null}

            {/* Close button */}
            <Pressable
              onPress={onDismiss}
              hitSlop={hitSlop.md}
              accessibilityRole="button"
              accessibilityLabel="Close story"
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Tap zones — left half goes back, right half goes forward */}
        <View style={styles.tapZones} pointerEvents="box-none">
          <Pressable
            style={styles.tapLeft}
            onPress={handleLeftTap}
            accessibilityRole="button"
            accessibilityLabel="Previous story"
          />
          <Pressable
            style={styles.tapRight}
            onPress={handleRightTap}
            accessibilityRole="button"
            accessibilityLabel="Next story"
          />
        </View>

        {/* TODO: video playback — using poster/thumbnail above for now */}
      </Animated.View>
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    // Simulate gradient with opacity layers via backgroundColor
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    top: 120, // below chrome
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
});
