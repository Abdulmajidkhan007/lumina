import { HeartIcon, CommentIcon, SendIcon } from './icons';

const STORY_RING_COUNT = 5;

/**
 * A pure CSS/div phone frame with a mini feed UI inside, used as the hero
 * illustration on the marketing home page. No raster images are used so the
 * mockup stays crisp at any size and adds no network weight.
 */
export function PhoneMockup() {
  return (
    <div
      className="relative mx-auto h-[560px] w-[280px] rounded-[42px] border-[6px] border-white/10 bg-[#100c1a] p-2 shadow-2xl shadow-brand-magenta/20 sm:h-[620px] sm:w-[310px]"
      role="img"
      aria-label="Preview of the Lumina app feed showing stories and a photo post"
    >
      <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/60" />
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-[#0e0b16]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pb-2 pt-6">
          <span className="text-sm font-semibold text-gradient-brand">Lumina</span>
          <div className="h-2 w-2 rounded-full bg-brand-violet" />
        </div>

        {/* Stories row */}
        <div className="flex gap-2 overflow-hidden px-4 pb-3">
          {Array.from({ length: STORY_RING_COUNT }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-brand p-[2px]">
                <div className="h-full w-full rounded-full bg-[#0e0b16] p-[2px]">
                  <div className="h-full w-full rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feed post card */}
        <div className="mx-3 flex flex-1 flex-col overflow-hidden rounded-2xl bg-white/[0.04]">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-6 w-6 rounded-full bg-gradient-brand" />
            <div className="h-2 w-16 rounded-full bg-white/20" />
          </div>
          <div className="relative mx-3 mb-2 flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-brand-coral/30 via-brand-magenta/30 to-brand-violet/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-2 border-white/30" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 pb-3">
            <HeartIcon className="h-5 w-5 text-white/70" />
            <CommentIcon className="h-5 w-5 text-white/70" />
            <SendIcon className="h-5 w-5 text-white/70" />
            <div className="ml-auto h-2 w-10 rounded-full bg-white/15" />
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="flex items-center justify-between px-6 py-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-gradient-brand' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
