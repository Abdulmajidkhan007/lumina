/**
 * Lumina — ReelItem
 *
 * Fullscreen reel "slide" for the vertical pager. Renders:
 * - Real video playback (VideoPlayer) for the active + adjacent items, with
 *   a poster (cover fill) fallback for everything else, plus a play badge
 * - Top + bottom dark gradient overlays for legibility
 * - Right-side ReelActions column
 * - Bottom-left ReelOverlay (username, caption, audio)
 * - Bottom-right mute toggle overlay
 * - Double-tap anywhere on the video/poster to like (Reanimated heart pop)
 *
 * Only the "active" item (tracked by ReelsPager) shows the overlay UI and
 * autoplays; adjacent items preload the video (muted, paused) so playback
 * starts instantly on swipe, and everything further away just shows the
 * poster to keep memory low.
 *
 * Memoized. All callbacks must be stable.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProtectedStackParamList } from '@/navigation';

import { useTheme } from '@/design-system/theme';
import { useLikeReel } from '@/data/query/hooks/useLikeReel';
import { useSaveReel } from '@/data/query/hooks/useSaveReel';
import { useFollowUser } from '@/data/query/hooks/useFollowUser';
import { useCurrentUser } from '@/stores/auth.store';
import { useAutoplayVideos } from '@/stores/preferences.store';
import { hitSlop, screen } from '@/constants/layout';
import type { Reel, ReelId, UserId } from '@/types/models';

import { ReelActions } from './ReelActions';
import { ReelOverlay } from './ReelOverlay';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  /** True for items directly before/after the active one — preloads video. */
  isAdjacent?: boolean;
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
}: ReelItemProps): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProtectedStackParamList>>();
  const currentUser = useCurrentUser();
  const autoplayVideos = useAutoplayVideos();
  const { mutate: likeReel } = useLikeReel();
  const { mutate: saveReel } = useSaveReel();
  const { mutate: followUser } = useFollowUser();

  // Local mute preference — defaults muted like most short-video feeds;
  // the user can toggle it per-reel via the bottom-right overlay button.
  const [isMuted, setIsMuted] = useState(true);

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
      likeReel({ reelId: reel.id, liked: true });
    }
    triggerHeartPop();
  }, [likeReel, reel.id, triggerHeartPop]);

  const handleLike = useCallback((reelId: ReelId, liked: boolean) => {
    likeReel({ reelId, liked });
  }, [likeReel]);

  const handleSave = useCallback((reelId: ReelId, saved: boolean) => {
    saveReel({ reelId, saved });
  }, [saveReel]);

  const handleComment = useCallback(() => {
    navigation.navigate('Comments', { postId: reel.id, postAuthorId: reel.author.id });
  }, [navigation, reel.id, reel.author.id]);

  const handleShare = useCallback(() => {
    // TODO: share sheet integration
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

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // ---------------------------------------------------------------------------
  // Double-tap gesture
  // ---------------------------------------------------------------------------

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => {
      runOnJS(handleDoubleTapLike)();
    });

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const thumbnailUri = reel.video.thumbnailUri ?? reel.video.uri;
  // Mount the real player for the active item plus its immediate neighbors
  // so playback starts instantly on swipe; everything else keeps the poster.
  const shouldLoadVideo = isActive || isAdjacent;
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
          paused={!isActive || !autoplayVideos}
          muted={isMuted}
          repeat
          resizeMode="cover"
          posterUri={thumbnailUri}
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

      {/* Double-tap gesture layer */}
      <GestureDetector gesture={doubleTap}>
        <View style={StyleSheet.absoluteFillObject} />
      </GestureDetector>

      {/* Heart pop overlay */}
      <HeartPopOverlay scale={heartScale} />

      {/* Play badge in top-right corner */}
      <View style={styles.playBadge} pointerEvents="none">
        <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.85)" />
      </View>

      {/* Only render interactive UI when active to save memory */}
      {isActive ? (
        <>
          {/* Mute toggle — bottom-right overlay on the video */}
          <Pressable
            onPress={handleToggleMute}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute reel' : 'Mute reel'}
            accessibilityState={{ selected: isMuted }}
            style={[styles.muteButton, { backgroundColor: theme.colors.overlay }]}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          {/* Right-side action column */}
          <View style={styles.actionsColumn}>
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
          <View style={styles.overlayContainer}>
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
    bottom: 100,
    alignItems: 'center',
  },
  heartOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  muteButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    left: 16,
    bottom: 100,
    right: 80, // leave space for action column
  },
});
