/**
 * Lumina — story media helpers (pure, unit-tested).
 */

export type StoryContentFit = 'cover' | 'contain';

/**
 * How a story's media should fill the screen. Portrait media close to the
 * screen's shape fills it edge-to-edge (`cover` crops only a sliver);
 * anything noticeably wider or taller — a landscape photo, a square post
 * screenshot — is shown whole (`contain`) on black, so nothing important is
 * cropped away.
 */
export function storyContentFit(
  mediaWidth: number,
  mediaHeight: number,
  screenWidth: number,
  screenHeight: number,
  tolerance = 0.3,
): StoryContentFit {
  if (mediaWidth <= 0 || mediaHeight <= 0 || screenWidth <= 0 || screenHeight <= 0) {
    return 'cover';
  }
  const mediaRatio = mediaWidth / mediaHeight;
  const screenRatio = screenWidth / screenHeight;
  return Math.abs(mediaRatio - screenRatio) / screenRatio <= tolerance ? 'cover' : 'contain';
}

export type StoryTapAction = 'prev' | 'next';

/** Instagram-style tap zones: the left third goes back, the rest goes forward. */
export function storyTapAction(x: number, screenWidth: number): StoryTapAction {
  return x < screenWidth / 3 ? 'prev' : 'next';
}
