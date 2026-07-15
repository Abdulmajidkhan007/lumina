/**
 * Lumina — VideoPlayer
 *
 * Thin typed wrapper over react-native-video's <Video>, scoped to the subset
 * of playback controls Lumina's reels/stories features need.
 *
 * - Renders the poster (via @/components/Image) until the player reports its
 *   first frame is ready for display, then swaps it out.
 * - Shows a spinner overlay while the player reports buffering.
 * - Owns no timers or subscriptions of its own — <Video> is unmounted by
 *   React normally, so there is nothing extra to tear down on unmount.
 */

import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Video, {
  type OnBufferData,
  type OnLoadData,
  type OnProgressData,
} from 'react-native-video';

import { Image } from '@/components/Image';
import { Spinner } from '@/design-system/primitives/Spinner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VideoPlayerResizeMode = 'cover' | 'contain';

export interface VideoPlayerProps {
  uri: string;
  paused: boolean;
  muted?: boolean;
  repeat?: boolean;
  resizeMode?: VideoPlayerResizeMode;
  posterUri?: string;
  onEnd?: () => void;
  /** Called once with the media duration in milliseconds when loaded. */
  onLoad?: (durationMs: number) => void;
  /** Called repeatedly with the current playback position in milliseconds. */
  onProgress?: (positionMs: number) => void;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function VideoPlayerBase({
  uri,
  paused,
  muted = false,
  repeat = false,
  resizeMode = 'cover',
  posterUri,
  onEnd,
  onLoad,
  onProgress,
  style,
}: VideoPlayerProps): React.JSX.Element {
  const [isReadyForDisplay, setIsReadyForDisplay] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const handleReadyForDisplay = useCallback(() => {
    setIsReadyForDisplay(true);
  }, []);

  const handleLoad = useCallback(
    (data: OnLoadData) => {
      onLoad?.(data.duration * 1000);
    },
    [onLoad],
  );

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      onProgress?.(data.currentTime * 1000);
    },
    [onProgress],
  );

  const handleBuffer = useCallback((data: OnBufferData) => {
    setIsBuffering(data.isBuffering);
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Video
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        paused={paused}
        muted={muted}
        repeat={repeat}
        resizeMode={resizeMode}
        playInBackground={false}
        playWhenInactive={false}
        progressUpdateInterval={250}
        onReadyForDisplay={handleReadyForDisplay}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onBuffer={handleBuffer}
        onEnd={onEnd}
      />

      {/* Poster stays mounted on top until the first real frame is ready */}
      {!isReadyForDisplay && posterUri !== undefined ? (
        <Image
          source={{ uri: posterUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit={resizeMode}
          accessibilityRole="image"
          accessibilityLabel="Video poster"
        />
      ) : null}

      {/* Buffering spinner — independent of poster visibility */}
      {isBuffering ? (
        <View style={styles.spinnerOverlay} pointerEvents="none">
          <Spinner size="md" colorVariant="inverse" />
        </View>
      ) : null}
    </View>
  );
}

export const VideoPlayer = memo(VideoPlayerBase);
export default VideoPlayer;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
