import { useCallback, useEffect, useState } from 'react';
import { fetchStoryReels, type StoryReel } from '../lib/content';
import { Avatar } from './Avatar';
import { StoryViewer } from './StoryViewer';

/**
 * Horizontal story rail shown above the web feed. Unseen reels get the brand
 * ring, seen ones a muted ring. Clicking opens the fullscreen StoryViewer,
 * which moves on to the next author after the last story.
 */
export function StoriesStrip() {
  const [reels, setReels] = useState<StoryReel[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const load = useCallback(() => {
    void fetchStoryReels().then(setReels).catch(() => setReels([]));
  }, []);

  useEffect(load, [load]);

  const close = useCallback(() => {
    setOpenIndex(null);
    load(); // refresh seen rings
  }, [load]);

  if (reels.length === 0) return null;

  const active = openIndex !== null ? reels[openIndex] : undefined;

  return (
    <>
      <div className="mb-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {reels.map((reel, i) => (
          <button
            key={reel.author.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <span className={`rounded-full p-[2px] ${reel.hasUnseen ? 'bg-gradient-brand' : 'bg-border'}`}>
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

      {active && openIndex !== null ? (
        <StoryViewer
          key={active.author.id}
          reel={active}
          onClose={close}
          onFinished={() => (openIndex + 1 < reels.length ? setOpenIndex(openIndex + 1) : close())}
        />
      ) : null}
    </>
  );
}
