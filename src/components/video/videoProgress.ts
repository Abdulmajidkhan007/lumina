/** 0–1 playback fraction, safe against zero/unknown durations and overshoot. */
export function playbackFraction(positionMs: number, durationMs: number): number {
  if (!(durationMs > 0) || !(positionMs > 0)) return 0;
  return Math.min(positionMs / durationMs, 1);
}

/** Playback rate for the reel's hold-to-speed-up gesture. */
export const FAST_RATE = 2;
export const NORMAL_RATE = 1;
