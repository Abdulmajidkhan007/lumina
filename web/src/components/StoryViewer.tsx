import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { fetchStoryViewers, markStorySeen, type StoryReel, type StoryView } from '../lib/content';
import { auth } from '../lib/firebase';
import { formatRelativeTime } from '../lib/time';
import { useI18n } from '../i18n';
import { Avatar } from './Avatar';

const STORY_DURATION_MS = 5000;
const HOLD_MS = 200;

interface StoryViewerProps {
  reel: StoryReel;
  onClose: () => void;
  /** Called after the last story — e.g. to advance to the next author. */
  onFinished?: () => void;
}

/**
 * Fullscreen story viewer, matching the mobile app: segmented progress bars,
 * click the left third for the previous story and anywhere else for the
 * next, press and hold to pause. Media is shown whole (object-contain) at
 * full quality with only a light gradient behind the header. On your own
 * story a "Seen by" button lists the viewers.
 */
export function StoryViewer({ reel, onClose, onFinished }: StoryViewerProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [held, setHeld] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<StoryView[] | null>(null);
  const [viewersError, setViewersError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const holdTimer = useRef<number | null>(null);
  const didHold = useRef(false);
  const marked = useRef(new Set<string>());

  const story = reel.stories[index];
  const isOwn = auth.currentUser?.uid === reel.author.id;
  const paused = held || viewersOpen;

  const next = useCallback(() => {
    setProgress(0);
    if (index + 1 < reel.stories.length) setIndex((i) => i + 1);
    else (onFinished ?? onClose)();
  }, [index, reel.stories.length, onClose, onFinished]);

  const prev = useCallback(() => {
    setProgress(0);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Seen-marker + view record, once per story.
  useEffect(() => {
    if (!story || marked.current.has(story.id)) return;
    marked.current.add(story.id);
    void markStorySeen(story.id, reel.author.id).catch(() => undefined);
  }, [story, reel.author.id]);

  // Viewer count for own stories.
  const loadViewers = useCallback(() => {
    if (!story || !isOwn) return;
    setViewersError(false);
    fetchStoryViewers(story.id)
      .then(setViewers)
      .catch(() => setViewersError(true));
  }, [story, isOwn]);

  useEffect(() => {
    setViewers(null);
    loadViewers();
  }, [loadViewers]);

  // Image timer — resumes from the current fill after a pause.
  useEffect(() => {
    if (!story || story.media.type === 'video' || paused) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setProgress((p) => {
        const nextP = p + delta / STORY_DURATION_MS;
        return nextP >= 1 ? 1 : nextP;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [story, paused]);

  useEffect(() => {
    if (progress >= 1 && story?.media.type !== 'video') next();
  }, [progress, story, next]);

  // Video pause/play follows the hold state.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else void video.play().catch(() => undefined);
  }, [paused, index]);

  // Keyboard: ← → Esc, space = pause toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') {
        e.preventDefault();
        setHeld((h) => !h);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const onPointerDown = () => {
    didHold.current = false;
    holdTimer.current = window.setTimeout(() => {
      didHold.current = true;
      setHeld(true);
    }, HOLD_MS);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (didHold.current) {
      setHeld(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 3) prev();
    else next();
  };

  const onPointerCancel = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHeld(false);
  };

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={reel.author.username}
    >
      <div className="relative h-full w-full max-w-[min(100vw,56.25vh)] select-none overflow-hidden bg-black">
        {/* Media — full quality, never dimmed */}
        {story.media.type === 'video' ? (
          <video
            key={story.id}
            ref={videoRef}
            src={story.media.uri}
            poster={story.media.thumbnailUri}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-contain"
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration > 0) setProgress(v.currentTime / v.duration);
            }}
            onEnded={next}
          />
        ) : (
          <img
            key={story.id}
            src={story.media.uri}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}

        {/* Tap / hold surface */}
        <div
          className="absolute inset-0"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Top chrome: light gradient + progress + author */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/45 to-transparent px-2 pb-10 pt-3 transition-opacity ${
            held ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex gap-1" aria-label={t('Story {current} of {total}', { current: index + 1, total: reel.stories.length })}>
            {reel.stories.map((s, i) => (
              <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded bg-white/35">
                <div
                  className="h-full bg-white"
                  style={{ width: `${i < index ? 100 : i === index ? Math.min(progress, 1) * 100 : 0}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 px-1">
            <Avatar name={reel.author.displayName} avatarUrl={reel.author.avatarUrl} size="sm" />
            <span className="truncate text-sm font-semibold text-white">{reel.author.username}</span>
            <span className="text-xs text-white/75">{formatRelativeTime(story.createdAt)}</span>
            {paused ? <span className="ml-auto text-xs text-white/80">❚❚</span> : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('Close')}
              className={`pointer-events-auto text-3xl leading-none text-white ${paused ? 'ml-3' : 'ml-auto'}`}
            >
              ×
            </button>
          </div>
        </div>

        {/* Own story: viewers */}
        {isOwn ? (
          <div className={`absolute inset-x-0 bottom-0 p-4 transition-opacity ${held ? 'opacity-0' : 'opacity-100'}`}>
            <button
              type="button"
              onClick={() => {
                setViewersOpen(true);
                loadViewers();
              }}
              className="rounded-full bg-black/35 px-4 py-2 text-sm text-white"
            >
              👁 {t('Seen by {count}', { count: viewers?.length ?? 0 })}
            </button>
          </div>
        ) : null}

        {viewersOpen ? (
          <div className="absolute inset-0 flex items-end bg-black/50" onClick={() => setViewersOpen(false)}>
            <div
              className="max-h-[70%] w-full overflow-y-auto rounded-t-2xl bg-bg-elevated p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-text">{t('Viewers')}</h2>
                <span className="text-sm text-text-muted">{viewers?.length ?? ''}</span>
              </div>
              {viewersError ? (
                <div className="py-6 text-center text-sm text-text-muted">
                  {t("Couldn't load viewers.")}{' '}
                  <button type="button" className="underline" onClick={loadViewers}>
                    {t('Retry')}
                  </button>
                </div>
              ) : viewers === null ? (
                <p className="py-6 text-center text-sm text-text-muted">{t('Loading…')}</p>
              ) : viewers.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">{t('No views yet')}</p>
              ) : (
                <ul className="space-y-3">
                  {viewers.map((v) => (
                    <li key={v.viewer.id} className="flex items-center gap-3">
                      <Avatar name={v.viewer.displayName} avatarUrl={v.viewer.avatarUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{v.viewer.username}</p>
                        <p className="truncate text-xs text-text-muted">{v.viewer.displayName}</p>
                      </div>
                      <span className="text-xs text-text-faint">{formatRelativeTime(v.viewedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
