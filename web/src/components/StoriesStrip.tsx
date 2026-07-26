import { useEffect, useState } from 'react';
import { fetchStoryReels, type StoryReel } from '../lib/content';
import { Avatar } from './Avatar';

/**
 * Horizontal story rail shown above the web feed. Clicking a ring opens a
 * lightweight lightbox that steps through that author's active stories.
 */
export function StoriesStrip() {
  const [reels, setReels] = useState<StoryReel[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    void fetchStoryReels().then(setReels).catch(() => setReels([]));
  }, []);

  if (reels.length === 0) return null;

  const active = openIndex !== null ? reels[openIndex] : null;
  const story = active?.stories[storyIndex];

  const close = () => {
    setOpenIndex(null);
    setStoryIndex(0);
  };

  const next = () => {
    if (!active) return;
    if (storyIndex + 1 < active.stories.length) setStoryIndex((i) => i + 1);
    else close();
  };

  return (
    <>
      <div className="mb-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {reels.map((reel, i) => (
          <button
            key={reel.author.id}
            type="button"
            onClick={() => {
              setOpenIndex(i);
              setStoryIndex(0);
            }}
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <span className="rounded-full bg-gradient-brand p-[2px]">
              <span className="block rounded-full bg-bg p-[2px]">
                <Avatar name={reel.author.displayName} avatarUrl={reel.author.avatarUrl} size="md" />
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-text-muted">
              {reel.author.username}
            </span>
          </button>
        ))}
      </div>

      {active && story ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-label={`Stories by ${active.author.username}`}
        >
          <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 text-2xl text-white">
            ×
          </button>
          <button type="button" onClick={next} className="max-h-full max-w-lg">
            {story.media.type === 'video' ? (
              <video src={story.media.uri} autoPlay controls playsInline className="max-h-[80vh] rounded-xl" />
            ) : (
              <img src={story.media.uri} alt="" className="max-h-[80vh] rounded-xl object-contain" />
            )}
          </button>
          <p className="absolute bottom-6 text-sm text-white/80">
            {active.author.username} · {storyIndex + 1}/{active.stories.length} — click to advance
          </p>
        </div>
      ) : null}
    </>
  );
}
