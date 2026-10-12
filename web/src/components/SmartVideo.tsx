import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { setVideoMuted, useVideoMuted } from '../lib/videoPrefs';
import { useI18n } from '../i18n';

const DOUBLE_TAP_MS = 250;
const HOLD_MS = 300;

interface SmartVideoProps {
  src: string;
  poster?: string;
  className?: string;
  /** Double-click / double-tap: like (the heart pop is drawn here). */
  onDoubleTap?: () => void;
  /** Enables hold-to-2x (Reels). */
  holdToSpeedUp?: boolean;
}

/**
 * Video with the app's controls: plays only while ≥60% on screen and the tab
 * is visible, click = pause/resume (centered icon), double-click = like
 * with a heart, optional hold = 2x speed, global mute toggle, progress line.
 */
export function SmartVideo({ src, poster, className = '', onDoubleTap, holdToSpeedUp = false }: SmartVideoProps) {
  const { t } = useI18n();
  const muted = useVideoMuted();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible');
  const [userPaused, setUserPaused] = useState(false);
  const [fast, setFast] = useState(false);
  const [progress, setProgress] = useState(0);
  const [heart, setHeart] = useState(0);
  const tapTimer = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible((entry?.intersectionRatio ?? 0) >= 0.6), {
      threshold: [0, 0.6, 1],
    });
    io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Scrolling away resets a manual pause, like the app.
  useEffect(() => {
    if (!visible) setUserPaused(false);
  }, [visible]);

  const shouldPlay = visible && pageVisible && !userPaused;
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (shouldPlay) void el.play().catch(() => undefined);
    else el.pause();
  }, [shouldPlay]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = fast ? 2 : 1;
  }, [fast]);

  const clearTimers = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const onPointerDown = () => {
    held.current = false;
    if (!holdToSpeedUp) return;
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      setUserPaused(false);
      setFast(true);
    }, HOLD_MS);
  };

  const onPointerUp = useCallback(
    (_e: PointerEvent<HTMLDivElement>) => {
      clearTimers();
      if (held.current) {
        held.current = false;
        setFast(false);
        return;
      }
      if (tapTimer.current !== null) {
        // Second tap inside the window → like, never a pause toggle.
        window.clearTimeout(tapTimer.current);
        tapTimer.current = null;
        if (onDoubleTap) {
          onDoubleTap();
          setHeart((h) => h + 1);
        }
        return;
      }
      tapTimer.current = window.setTimeout(() => {
        tapTimer.current = null;
        setUserPaused((p) => !p);
      }, DOUBLE_TAP_MS);
    },
    [onDoubleTap],
  );

  return (
    <div className={`relative select-none overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setProgress(v.duration > 0 ? v.currentTime / v.duration : 0);
        }}
      />
      <div
        className="absolute inset-0 cursor-pointer"
        role="button"
        aria-label={t('Video — tap to play or pause, double-tap to like')}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          clearTimers();
          setFast(false);
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      {userPaused ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 pl-1 text-3xl text-white">▶</span>
        </div>
      ) : null}
      {fast ? (
        <span className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white">
          ⏩ 2x
        </span>
      ) : null}
      {heart > 0 ? (
        <span
          key={heart}
          className="pointer-events-none absolute inset-0 flex animate-[heart-pop_700ms_ease-out_forwards] items-center justify-center text-7xl"
          aria-hidden="true"
        >
          ❤️
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => setVideoMuted(!muted)}
        aria-label={muted ? t('Unmute') : t('Mute')}
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-sm text-white"
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/25">
        <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
