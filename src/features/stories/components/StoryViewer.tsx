/**
 * Lumina — StoryViewer
 *
 * Fullscreen story viewer, Instagram-style:
 * - Segmented progress bars at the top (Reanimated, auto-advance)
 * - Tap the left third → previous, anywhere else → next
 * - Press and hold → pause (chrome fades out so the media is unobstructed)
 * - Swipe down → dismiss
 * - Media at full quality: portrait media fills the screen, landscape/square
 *   media is shown whole on black (see `storyContentFit`). Only a light
 *   gradient at the very top keeps the header legible — nothing dims the
 *   picture itself.
 * - Own stories: "Seen by N" pill at the bottom opens the viewers sheet.
 *   Other people's stories: quick emoji reactions.
 * - Marks stories seen (and records the view for the author) via storiesApi.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type ImageLoadEventData,
  type NativeSyntheticEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { Image } from '@/components/Image';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from '@/design-system/hooks';
import { Avatar } from '@/design-system/primitives/Avatar';
import { Text } from '@/design-system/primitives/Text';
import { hitSlop } from '@/constants/layout';
import { formatRelativeTime } from '@/utils/format';
import { storiesApi } from '@/data/api/client';
import { queryKeys } from '@/data/query/keys';
import { useStoryReaction } from '@/data/query/hooks/useStoryReaction';
import { useStoryViewers } from '@/data/query/hooks/useStoryViewers';
import { useCurrentUser } from '@/stores/auth.store';
import type { ProtectedStackParamList } from '@/navigation/types';
import type { StoryReel } from '@/types/models';
import { StoryProgressBar } from './StoryProgressBar';
import { StoryViewersSheet } from './StoryViewersSheet';
import { storyContentFit, storyTapAction } from '../utils/storyMedia';

// ---------------------------------------------------------------------------
// Constants — the viewer is always dark, independent of the app theme
// ---------------------------------------------------------------------------

const STORY_DURATION_MS = 5000;
const SWIPE_DISMISS_THRESHOLD = 80;
const LONG_PRESS_MS = 200;
const ON_MEDIA = '#FFFFFF';
const ON_MEDIA_MUTED = 'rgba(255,255,255,0.8)';
const TOP_GRADIENT = ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)'];
const PILL_BG = 'rgba(0,0,0,0.35)';

// ---------------------------------------------------------------------------
// Reaction bar — quick emoji reactions shown on other people's stories
// ---------------------------------------------------------------------------

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😍', '🔥'] as const;

interface ReactionButtonProps {
  emoji: string;
  onPressIn: () => void;
  onPressOut: () => void;
  onReact: (emoji: string) => void;
}

/** One emoji in the reaction bar — owns its own pop-scale animation. */
function ReactionButton({ emoji, onPressIn, onPressOut, onReact }: ReactionButtonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = reducedMotion
      ? 1
      : withSequence(withTiming(1.5, { duration: 120 }), withSpring(1, { damping: 8, stiffness: 200 }));
    onReact(emoji);
  }, [reducedMotion, scale, emoji, onReact]);

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handlePress}
      hitSlop={hitSlop.sm}
      accessibilityRole="button"
      accessibilityLabel={emoji}
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
  /**
   * Extra bottom action rendered on your own stories next to "Seen by"
   * (e.g. "Add to highlight"). Receives the current story and a setter that
   * pauses playback while its own UI is open.
   */
  renderOwnAction?: (args: {
    storyIndex: number;
    setPausedByAction: (paused: boolean) => void;
  }) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryViewer({ reel, onDismiss, renderOwnAction }: StoryViewerProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const queryClient = useQueryClient();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const currentUser = useCurrentUser();
  const { mutate: sendReaction } = useStoryReaction();

  const [storyIndex, setStoryIndex] = useState(0);
  const [holdPaused, setHoldPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [pausedByAction, setPausedByAction] = useState(false);
  const isPaused = holdPaused || interactionPaused || viewersOpen || pausedByAction;

  const progress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const chromeOpacity = useSharedValue(1);

  // Duration (ms) of the current video story, reported by VideoPlayer.
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  // Natural size of the current image, once loaded — the stored dimensions of
  // older stories are a 1080×1920 placeholder, so the real size wins.
  const [loadedSize, setLoadedSize] = useState<{ width: number; height: number } | null>(null);

  const story = reel.stories[storyIndex];
  const isOwnReel = currentUser != null && reel.author.id === currentUser.id;

  // Refresh the tray's seen-rings once the viewer closes.
  useEffect(
    () => () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.storyReels() });
    },
    [queryClient],
  );

  // ---------------------------------------------------------------------------
  // Seen + viewers
  // ---------------------------------------------------------------------------

  const markedRef = useRef(new Set<string>());
  useEffect(() => {
    if (story == null || markedRef.current.has(story.id)) return;
    markedRef.current.add(story.id);
    // Own stories still get a seen-marker (it's a no-op for the view count).
    storiesApi.markSeen(story.id, reel.author.id).catch((e: unknown) => {
      console.warn('[stories] markSeen failed', e);
    });
  }, [story, reel.author.id]);

  const viewersQuery = useStoryViewers(story?.id ?? null, isOwnReel);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const resetForStory = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    setVideoDurationMs(0);
    setLoadedSize(null);
  }, [progress]);

  const goNext = useCallback(() => {
    if (storyIndex + 1 < reel.stories.length) {
      resetForStory();
      setStoryIndex(storyIndex + 1);
    } else {
      onDismiss();
    }
  }, [storyIndex, reel.stories.length, resetForStory, onDismiss]);

  const goPrev = useCallback(() => {
    resetForStory();
    if (storyIndex > 0) setStoryIndex(storyIndex - 1);
    // On the first story a back-tap restarts it (progress reset above).
  }, [storyIndex, resetForStory]);

  // ---------------------------------------------------------------------------
  // Auto-advance timer (images). Resumes from the current fill after a pause.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isPaused || story == null) return;
    if (story.media.type === 'video') return; // driven by playback position

    const remaining = Math.max(STORY_DURATION_MS * (1 - progress.value), 0);
    progress.value = withTiming(1, { duration: remaining }, (finished) => {
      if (finished) runOnJS(goNext)();
    });
    return () => cancelAnimation(progress);
  }, [storyIndex, isPaused, goNext, progress, story]);

  // Chrome hides while holding, like Instagram.
  useEffect(() => {
    chromeOpacity.value = withTiming(holdPaused ? 0 : 1, { duration: 150 });
  }, [holdPaused, chromeOpacity]);

  // ---------------------------------------------------------------------------
  // Media callbacks
  // ---------------------------------------------------------------------------

  const handleVideoLoad = useCallback((durationMs: number) => setVideoDurationMs(durationMs), []);

  const handleVideoProgress = useCallback(
    (positionMs: number) => {
      if (videoDurationMs > 0) progress.value = Math.min(positionMs / videoDurationMs, 1);
    },
    [progress, videoDurationMs],
  );

  const handleVideoEnd = useCallback(() => {
    progress.value = 1;
    goNext();
  }, [goNext, progress]);

  const handleImageLoad = useCallback((e: NativeSyntheticEvent<ImageLoadEventData>) => {
    const { width, height } = e.nativeEvent.source;
    if (width > 0 && height > 0) setLoadedSize({ width, height });
  }, []);

  const contentFit = useMemo(() => {
    if (story == null) return 'cover' as const;
    const w = loadedSize?.width ?? story.media.width;
    const h = loadedSize?.height ?? story.media.height;
    return storyContentFit(w, h, screenWidth, screenHeight);
  }, [story, loadedSize, screenWidth, screenHeight]);

  // ---------------------------------------------------------------------------
  // Gestures: tap zones + hold-to-pause on one Pressable, swipe-down via RNGH
  // ---------------------------------------------------------------------------

  const handleTap = useCallback(
    (e: GestureResponderEvent) => {
      if (storyTapAction(e.nativeEvent.locationX, screenWidth) === 'prev') goPrev();
      else goNext();
    },
    [screenWidth, goPrev, goNext],
  );
  const handleLongPress = useCallback(() => setHoldPaused(true), []);
  const handlePressOut = useCallback(() => setHoldPaused(false), []);

  const panGesture = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetX([-25, 25])
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > SWIPE_DISMISS_THRESHOLD || e.velocityY > 800) {
        runOnJS(onDismiss)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - translateY.value / (screenHeight * 0.5),
  }));

  const chromeStyle = useAnimatedStyle(() => ({ opacity: chromeOpacity.value }));

  // ---------------------------------------------------------------------------
  // Reactions / viewers
  // ---------------------------------------------------------------------------

  const pauseForInteraction = useCallback(() => setInteractionPaused(true), []);
  const resumeAfterInteraction = useCallback(() => setInteractionPaused(false), []);

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

  const openViewers = useCallback(() => {
    setViewersOpen(true);
    void viewersQuery.refetch();
  }, [viewersQuery]);

  const closeViewers = useCallback(() => setViewersOpen(false), []);

  const openViewerProfile = useCallback(
    (userId: string) => {
      setViewersOpen(false);
      navigation.navigate('UserProfile', { id: userId });
    },
    [navigation],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (story == null) return <View style={styles.container} />;

  const viewerCount = viewersQuery.data?.length ?? 0;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Media */}
        {story.media.type === 'video' ? (
          <VideoPlayer
            key={story.id}
            uri={story.media.uri}
            paused={isPaused}
            repeat={false}
            resizeMode={contentFit}
            posterUri={story.media.thumbnailUri}
            onLoad={handleVideoLoad}
            onProgress={handleVideoProgress}
            onEnd={handleVideoEnd}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <Image
            key={story.id}
            source={{ uri: story.media.uri }}
            style={StyleSheet.absoluteFillObject}
            contentFit={contentFit}
            onLoad={handleImageLoad}
            accessibilityLabel={reel.author.username}
          />
        )}

        {/* Tap / hold surface — beneath the chrome so its buttons stay tappable */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleTap}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={LONG_PRESS_MS}
          accessibilityRole="button"
          accessibilityLabel={t('storyViewer.next')}
        />

        {/* Top: light gradient + progress + author row */}
        <Animated.View style={[styles.topChrome, chromeStyle]} pointerEvents="box-none">
          <LinearGradient
            colors={TOP_GRADIENT}
            style={[StyleSheet.absoluteFillObject, { height: insets.top + 110 }]}
            pointerEvents="none"
          />
          <View
            style={{ paddingTop: insets.top + theme.spacing.sm, paddingHorizontal: theme.spacing.sm }}
            pointerEvents="box-none"
          >
            <View
              accessibilityLabel={t('storyViewer.progress', {
                current: storyIndex + 1,
                total: reel.stories.length,
              })}
            >
              <StoryProgressBar count={reel.stories.length} activeIndex={storyIndex} progress={progress} />
            </View>

            <View
              style={[styles.authorRow, { marginTop: theme.spacing.sm, paddingHorizontal: theme.spacing.xs }]}
              pointerEvents="box-none"
            >
              <Avatar
                uri={reel.author.avatarUrl ?? undefined}
                displayName={reel.author.displayName}
                size="sm"
              />
              <View style={[styles.authorInfo, { marginLeft: theme.spacing.sm }]}>
                <Text variant="bodyStrong" style={styles.onMedia} numberOfLines={1}>
                  {reel.author.username}
                </Text>
                <Text variant="caption" style={styles.onMediaMuted}>
                  {formatRelativeTime(story.createdAt)}
                </Text>
              </View>
              {isPaused ? (
                <Ionicons name="pause" size={20} color={ON_MEDIA_MUTED} style={{ marginRight: theme.spacing.md }} />
              ) : null}
              <Pressable
                onPress={onDismiss}
                hitSlop={hitSlop.md}
                accessibilityRole="button"
                accessibilityLabel={t('storyViewer.close')}
              >
                <Ionicons name="close" size={28} color={ON_MEDIA} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Bottom: viewers (own) or reactions (others) */}
        <Animated.View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
            },
            chromeStyle,
          ]}
          pointerEvents="box-none"
        >
          {isOwnReel ? (
            <View style={[styles.ownActions, { gap: theme.spacing.sm }]} pointerEvents="box-none">
              <Pressable
                onPress={openViewers}
                hitSlop={hitSlop.sm}
                accessibilityRole="button"
                accessibilityLabel={t('storyViewer.openViewers')}
                style={[
                  styles.pill,
                  {
                    backgroundColor: PILL_BG,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radii.full,
                    gap: theme.spacing.xs,
                  },
                ]}
              >
                <Ionicons name="eye-outline" size={18} color={ON_MEDIA} />
                <Text variant="callout" style={styles.onMedia}>
                  {t('storyViewer.seenBy', { count: viewerCount })}
                </Text>
              </Pressable>
              {renderOwnAction?.({ storyIndex, setPausedByAction })}
            </View>
          ) : (
            <View style={styles.reactionBar} pointerEvents="box-none">
              {REACTION_EMOJIS.map((emoji) => (
                <ReactionButton
                  key={emoji}
                  emoji={emoji}
                  onPressIn={pauseForInteraction}
                  onPressOut={resumeAfterInteraction}
                  onReact={handleReact}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {isOwnReel ? (
          <StoryViewersSheet
            visible={viewersOpen}
            onDismiss={closeViewers}
            viewers={viewersQuery.data}
            isLoading={viewersQuery.isLoading}
            isError={viewersQuery.isError}
            onRetry={() => void viewersQuery.refetch()}
            onViewerPress={openViewerProfile}
          />
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
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  onMedia: {
    color: ON_MEDIA,
  },
  onMediaMuted: {
    color: ON_MEDIA_MUTED,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ownActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
