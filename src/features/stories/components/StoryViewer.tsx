/**
 * Lumina — StoryViewer
 *
 * Fullscreen dark story viewer with:
 * - Segmented progress bars (Reanimated, auto-advance)
 * - Tap left/right to go prev/next
 * - Long-press to pause
 * - Swipe-down (PanGesture) to dismiss
 * - Author avatar + name + timestamp + close button
 * - expo-image for image stories; real video playback (VideoPlayer) for
 *   video stories, auto-advancing on video end instead of a fixed timer
 * - Marks stories seen via storiesApi
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from '@/components/Image';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';
import { formatRelativeTime } from '@/utils/format';
import { storiesApi } from '@/data/api/client';
import { useStoryReaction } from '@/data/query/hooks/useStoryReaction';
import { useCurrentUser } from '@/stores/auth.store';
import type { StoryReel } from '@/types/models';
import { StoryProgressBar } from './StoryProgressBar';

// ---------------------------------------------------------------------------
// Reaction bar — quick emoji reactions shown on other people's stories
// ---------------------------------------------------------------------------

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😍', '🔥'] as const;

interface ReactionButtonProps {
  emoji: string;
  accessibilityLabel: string;
  onPressIn: () => void;
  onPressOut: () => void;
  onReact: (emoji: string) => void;
}

/** One emoji in the reaction bar — owns its own pop-scale animation. */
function ReactionButton({
  emoji,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  onReact,
}: ReactionButtonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = reducedMotion
      ? 1
      : withSequence(
          withTiming(1.5, { duration: 120 }),
          withSpring(1, { damping: 8, stiffness: 200 }),
        );
    onReact(emoji);
  }, [reducedMotion, scale, emoji, onReact]);

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handlePress}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={animatedStyle}>
        <Text variant="title">{emoji}</Text>
      </Animated.View>
    </Pressable>
  );
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryViewer({
  reel,
  onDismiss,
}: StoryViewerProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const currentUser = useCurrentUser();
  const { mutate: sendReaction } = useStoryReaction();

  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progress = useSharedValue(0);

  // Duration (ms) of the current video story, reported by VideoPlayer's
  // onLoad. Drives the progress bar via onProgress instead of a timer.
  const [videoDurationMs, setVideoDurationMs] = useState(0);

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
    // Video stories auto-advance via VideoPlayer's onEnd + drive the
    // progress bar from real playback position instead of a fixed timer.
    if (story?.media.type === 'video') return;

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
  }, [storyIndex, isPaused, goNext, progress, story]);

  // Mark current story seen on mount/index change
  useEffect(() => {
    markSeen(storyIndex);
  }, [markSeen, storyIndex]);

  // Reset the known video duration whenever the story changes so a stale
  // duration from the previous video can't be used to compute progress.
  useEffect(() => {
    setVideoDurationMs(0);
  }, [storyIndex]);

  // ---------------------------------------------------------------------------
  // Video story callbacks — progress bar driven by real playback position
  // ---------------------------------------------------------------------------

  const handleVideoLoad = useCallback((durationMs: number) => {
    setVideoDurationMs(durationMs);
  }, []);

  const handleVideoProgress = useCallback(
    (positionMs: number) => {
      if (videoDurationMs > 0) {
        progress.value = Math.min(positionMs / videoDurationMs, 1);
      }
    },
    [progress, videoDurationMs],
  );

  const handleVideoEnd = useCallback(() => {
    progress.value = 1;
    goNext();
  }, [goNext, progress]);

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
    opacity: 1 - translateY.value / (screenHeight * 0.5),
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
  // Reaction bar — only on other people's stories, never your own
  // ---------------------------------------------------------------------------

  const isOwnReel = currentUser != null && reel.author.id === currentUser.id;

  const handleReactionPressIn = useCallback(() => setIsPaused(true), []);
  const handleReactionPressOut = useCallback(() => setIsPaused(false), []);

  const handleReact = useCallback(
    (emoji: string) => {
      if (story == null) return;
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      sendReaction({ storyId: story.id, emoji });
    },
    [story, sendReaction],
  );

  const reactionAccessibilityLabels: Record<string, string> = {
    '❤️': t('stories.reactions.heart'),
    '😂': t('stories.reactions.laugh'),
    '😮': t('stories.reactions.wow'),
    '😍': t('stories.reactions.love'),
    '🔥': t('stories.reactions.fire'),
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (story == null) return <View style={styles.container} />;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Background media */}
        {story.media.type === 'video' ? (
          <VideoPlayer
            uri={story.media.uri}
            paused={isPaused}
            repeat={false}
            resizeMode="cover"
            posterUri={story.media.thumbnailUri}
            onLoad={handleVideoLoad}
            onProgress={handleVideoProgress}
            onEnd={handleVideoEnd}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <Image
            source={{ uri: story.media.uri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={100}
            accessibilityLabel="Story image"
          />
        )}

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

        {/* Reaction bar — only on other people's stories */}
        {!isOwnReel ? (
          <View
            style={[
              styles.reactionBar,
              {
                paddingBottom: insets.bottom + theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
              },
            ]}
            pointerEvents="box-none"
          >
            {REACTION_EMOJIS.map((emoji) => (
              <ReactionButton
                key={emoji}
                emoji={emoji}
                accessibilityLabel={reactionAccessibilityLabels[emoji] ?? emoji}
                onPressIn={handleReactionPressIn}
                onPressOut={handleReactionPressOut}
                onReact={handleReact}
              />
            ))}
          </View>
        ) : null}
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
  reactionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
