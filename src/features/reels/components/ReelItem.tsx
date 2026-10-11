/**
 * Lumina — ReelItem
 *
 * Fullscreen reel "slide" for the vertical pager. Renders:
 * - Real video playback (VideoPlayer) for the active + adjacent items, with
 *   a poster (cover fill) fallback for everything else, plus a play badge
 * - Top + bottom dark gradient overlays for legibility
 * - Right-side ReelActions column
 * - Bottom-left ReelOverlay (username, caption, audio)
 * - Playback controls: tap = pause/resume (centered icon), hold = 2x speed
 *   (back to 1x on release), double-tap = like (heart pop), global mute
 *   button (shared with feed videos), progress line above the tab bar
 * - Pauses when the Reels screen loses focus or the app goes to background
 *
 * Only the "active" item (tracked by ReelsPager) shows the overlay UI and
 * autoplays; adjacent items preload the video (muted, paused) so playback
 * starts instantly on swipe, and everything further away just shows the
 * poster to keep memory low.
 *
 * Memoized. All callbacks must be stable.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from '@/components/Image';
import { VideoPlayer } from '@/components/VideoPlayer';
import LinearGradient from 'react-native-linear-gradient';
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
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';

import { useTheme } from '@/design-system/theme';
import { useLikeReel } from '@/data/query/hooks/useLikeReel';
import { useSaveReel } from '@/data/query/hooks/useSaveReel';
import { useFollowUser } from '@/data/query/hooks/useFollowUser';
import { useCurrentUser } from '@/stores/auth.store';
import { useAutoplayVideos, useVideoMuted } from '@/stores/preferences.store';
import { screen, tabBarHeight } from '@/constants/layout';
import {
  FAST_RATE,
  MuteButton,
  NORMAL_RATE,
  PlaybackIndicator,
  VideoProgressBar,
  playbackFraction,
} from '@/components/video';
import type { Reel, ReelId, UserId } from '@/types/models';

import { ReelActions } from './ReelActions';
import { ShareToConversationsSheet } from '@/components/ShareToConversationsSheet';
import type { PostId } from '@/types/models';
import { ReelOverlay } from './ReelOverlay';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  /** True for items directly before/after the active one — preloads video. */
  isAdjacent?: boolean;
  /** False while the screen is unfocused or the app is backgrounded. */
  playbackAllowed?: boolean;
}

// ---------------------------------------------------------------------------
// Heart pop overlay (floating centered heart on double-tap)
// ---------------------------------------------------------------------------

function HeartPopOverlay({
  scale,
}: {
  scale: Animated.SharedValue<number>;
}): React.JSX.Element {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 0.05 ? 1 : 0,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.heartOverlay, animatedStyle]}
      pointerEvents="none"
    >
      <Ionicons name="heart" size={90} color="rgba(255,255,255,0.9)" />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ReelItem
// ---------------------------------------------------------------------------

export const ReelItem = React.memo(function ReelItem({
  reel,
  isActive,
  isAdjacent = false,
  playbackAllowed = true,
}: ReelItemProps): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();
  const autoplayVideos = useAutoplayVideos();
  const { mutate: likeReel } = useLikeReel();
  const { mutate: saveReel } = useSaveReel();
  const { mutate: followUser } = useFollowUser();

  // Global sound switch, shared with feed videos.
  const isMuted = useVideoMuted();
  const [shareOpen, setShareOpen] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isFast, setIsFast] = useState(false);
  const progress = useSharedValue(0);
  const durationRef = useRef(0);

  // Coming back to a reel always resumes it at normal speed.
  useEffect(() => {
    if (!isActive) {
      setUserPaused(false);
      setIsFast(false);
    }
  }, [isActive]);

  // Stable ref so gesture closure always has the latest value without
  // re-creating the gesture object on every render.
  const isLikedRef = useRef(reel.isLikedByMe);
  isLikedRef.current = reel.isLikedByMe;

  const heartScale = useSharedValue(0);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const triggerHeartPop = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1, { damping: 8, stiffness: 300 }),
      withTiming(0, { duration: 700 }),
    );
  }, [heartScale]);

  const handleDoubleTapLike = useCallback(() => {
    if (!isLikedRef.current) {
      likeReel({ reelId: reel.id, postId: reel.postId, liked: true });
    }
    triggerHeartPop();
  }, [likeReel, reel.id, reel.postId, triggerHeartPop]);

  const handleLike = useCallback((reelId: ReelId, liked: boolean) => {
    likeReel({ reelId, postId: reel.postId, liked });
  }, [likeReel, reel.postId]);

  const handleTogglePause = useCallback(() => setUserPaused((p) => !p), []);
  const handleFastStart = useCallback(() => {
    setUserPaused(false);
    setIsFast(true);
  }, []);
  const handleFastEnd = useCallback(() => setIsFast(false), []);

  const handleVideoLoad = useCallback((durationMs: number) => {
    durationRef.current = durationMs;
  }, []);

  const handleVideoProgress = useCallback(
    (positionMs: number) => {
      // onProgress fires every 250 ms — glide between ticks.
      progress.value = withTiming(playbackFraction(positionMs, durationRef.current), { duration: 250 });
    },
    [progress],
  );

  const handleSave = useCallback((reelId: ReelId, saved: boolean) => {
    saveReel({ reelId, saved });
  }, [saveReel]);

  const handleComment = useCallback(() => {
    navigation.navigate('Comments', { postId: reel.id, postAuthorId: reel.author.id });
  }, [navigation, reel.id, reel.author.id]);

  const handleShare = useCallback(() => {
    setShareOpen(true);
  }, []);

  const handleAuthorPress = useCallback((userId: UserId) => {
    navigation.navigate('UserProfile', { id: userId });
  }, [navigation]);

  // Bound version for ReelActions + ReelOverlay (both expect () => void)
  const handleAvatarPress = useCallback(() => {
    handleAuthorPress(reel.author.id);
  }, [handleAuthorPress, reel.author.id]);

  const handleUsernamePress = handleAvatarPress; // same destination, different element

  const handleFollow = useCallback(() => {
    followUser({ userId: reel.author.id, follow: true });
  }, [followUser, reel.author.id]);

  // ---------------------------------------------------------------------------
  // Gestures: hold (2x) > double-tap (like) > single tap (pause). Each lower
  // priority gesture waits for the higher one to fail, so a double-tap never
  // also toggles pause and a hold never counts as a tap.
  // ---------------------------------------------------------------------------

  const longPress = Gesture.LongPress()
    .minDuration(300)
    .maxDistance(30)
    .onStart(() => {
      runOnJS(handleFastStart)();
    })
    .onFinalize((_e, success) => {
      if (success) runOnJS(handleFastEnd)();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd((_e, success) => {
      if (success) runOnJS(handleDoubleTapLike)();
    });

  const singleTap = Gesture.Tap().onEnd((_e, success) => {
    if (success) runOnJS(handleTogglePause)();
  });

  const controls = Gesture.Exclusive(longPress, doubleTap, singleTap);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const thumbnailUri = reel.video.thumbnailUri ?? reel.video.uri;
  // Mount the real player for the active item plus its immediate neighbors
  // so playback starts instantly on swipe; everything else keeps the poster.
  const shouldLoadVideo = isActive || isAdjacent;
  const isPlaying = isActive && playbackAllowed && autoplayVideos && !userPaused;
  // The tab bar floats over the bottom of the pager.
  const chromeBottom = tabBarHeight.default + Math.max(insets.bottom, 8);
  const isMe = currentUser?.id === reel.author.id;
  // We use isFollowedByMe from author if available; fall back to false
  // UserSummary doesn't carry isFollowedByMe so we use a local check via
  // currentUser vs author — full follow state comes from useUser but that
  // would be per-item network cost. For optimistic UX show Follow for non-self.
  const isFollowedByMe = false; // UserSummary doesn't expose this; overlay hides button for self

  return (
    <View
      style={[styles.container, { width: screen.width, height: screen.height }]}
      accessibilityLabel={`Reel by ${reel.author.username}`}
    >
      {/* Video (active + adjacent items) or static poster (everything else) */}
      {shouldLoadVideo ? (
        <VideoPlayer
          uri={reel.video.uri}
          paused={!isPlaying}
          muted={isMuted || !isActive}
          rate={isFast && isActive ? FAST_RATE : NORMAL_RATE}
          repeat
          resizeMode="cover"
          posterUri={thumbnailUri}
          onLoad={isActive ? handleVideoLoad : undefined}
          onProgress={isActive ? handleVideoProgress : undefined}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <Image
          source={{ uri: thumbnailUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          recyclingKey={reel.id}
          accessibilityRole="image"
          accessibilityLabel={`Reel thumbnail by ${reel.author.username}`}
          transition={150}
        />
      )}

      {/* Top gradient — for any header UI */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Bottom gradient — for overlay legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Tap / double-tap / hold gesture layer */}
      <GestureDetector gesture={controls}>
        <View
          style={StyleSheet.absoluteFillObject}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('video.playPause')}
          onAccessibilityTap={handleTogglePause}
        />
      </GestureDetector>

      {/* Heart pop overlay */}
      <HeartPopOverlay scale={heartScale} />

      {/* Only render interactive UI when active to save memory */}
      {isActive ? (
        <>
          <PlaybackIndicator paused={userPaused} fast={isFast} />

          {/* Global mute toggle — top-right, opposite the "Reels" wordmark */}
          <MuteButton style={[styles.muteButton, { top: insets.top + 8 }]} />

          {/* Progress line just above the tab bar */}
          <VideoProgressBar progress={progress} style={{ bottom: chromeBottom }} />

          {/* Right-side action column */}
          <View style={[styles.actionsColumn, { bottom: chromeBottom + 24 }]}>
            <ReelActions
              reelId={reel.id}
              author={reel.author}
              likeCount={reel.likeCount}
              commentCount={reel.commentCount}
              shareCount={reel.shareCount}
              isLiked={reel.isLikedByMe}
              isSaved={reel.isSavedByMe}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              onAvatarPress={handleAvatarPress}
            />
          </View>

          {/* Bottom-left overlay */}
          <View style={[styles.overlayContainer, { bottom: chromeBottom + 16 }]}>
            <ReelOverlay
              username={reel.author.username}
              isFollowedByMe={isFollowedByMe}
              isMe={isMe}
              caption={reel.caption}
              audioTitle={reel.audioTitle}
              onUsernamePress={handleUsernamePress}
              onFollow={handleFollow}
            />
          </View>
        </>
      ) : null}

      {/* Dark overlay tint when not active (keeps list visually distinct) */}
      {!isActive ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: theme.colors.overlay },
          ]}
          pointerEvents="none"
        />
      ) : null}

      <ShareToConversationsSheet
        visible={shareOpen}
        postId={reel.id as unknown as PostId}
        onClose={() => setShareOpen(false)}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  actionsColumn: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
  },
  heartOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteButton: {
    position: 'absolute',
    right: 16,
  },
  overlayContainer: {
    position: 'absolute',
    left: 16,
    right: 80, // leave space for action column
  },
});
