import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  HomeIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  ProfileIcon,
  SearchIcon,
  SendIcon,
} from './icons';
import { useI18n } from '../i18n';

const STORIES = ['you', 'atoyo_uz', 'kidswear', 'nodira', 'sardor'] as const;
const AVATAR_COLORS = ['#B0B0B0', '#FF6B6B', '#C44FE8', '#6B5BFF', '#34C759'] as const;

interface PhoneMockupProps {
  /** Admin-uploaded real screenshot; when set it replaces the illustration. */
  screenshotUrl?: string;
}

/**
 * Hero phone. With a real screenshot it shows that; otherwise a CSS replica
 * of the app's Feed screen in its light theme (design-system tokens: grey50
 * background, white surfaces, coral→magenta→violet accents), so the landing
 * page looks like the app people actually install.
 */
export function PhoneMockup({ screenshotUrl }: PhoneMockupProps) {
  const { t } = useI18n();
  return (
    <div
      className="relative mx-auto h-[560px] w-[280px] rounded-[42px] border-[6px] border-white/15 bg-black p-1.5 shadow-2xl shadow-brand-magenta/20 sm:h-[620px] sm:w-[310px]"
      role="img"
      aria-label={t('Preview of the Lumina app feed showing stories and a photo post')}
    >
      <div className="absolute left-1/2 top-2.5 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      {screenshotUrl ? (
        <img src={screenshotUrl} alt="" className="h-full w-full rounded-[34px] object-cover object-top" />
      ) : (
        <AppFeedReplica youLabel={t('Your story')} likesLabel={t('{count} likes', { count: 128 })} />
      )}
    </div>
  );
}

function AppFeedReplica({ youLabel, likesLabel }: { youLabel: string; likesLabel: string }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[34px] bg-[#FAFAFA] text-[#0A0A0A]">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[10px] font-semibold">
        <span>9:41</span>
        <span className="h-2 w-5 rounded-sm border border-[#0A0A0A]" />
      </div>

      {/* Header: gradient wordmark + activity / messages */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xl font-extrabold tracking-tight text-gradient-brand">Lumina</span>
        <div className="flex items-center gap-3">
          <HeartIcon className="h-5 w-5" />
          <SendIcon className="h-5 w-5" />
        </div>
      </div>

      {/* Story rail */}
      <div className="flex gap-3 overflow-hidden border-b border-[#E8E8E8] px-3 pb-3 pt-1">
        {STORIES.map((name, index) => (
          <div key={name} className="flex w-12 shrink-0 flex-col items-center gap-1">
            <div className={`h-12 w-12 rounded-full p-[2px] ${index === 0 ? 'bg-[#E8E8E8]' : 'bg-gradient-brand'}`}>
              <div className="h-full w-full rounded-full bg-white p-[2px]">
                <div
                  className="flex h-full w-full items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                >
                  {index === 0 ? '+' : name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            <span className="w-full truncate text-center text-[9px] text-[#4A4A4A]">
              {index === 0 ? youLabel : name}
            </span>
          </div>
        ))}
      </div>

      {/* Post */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-gradient-brand p-[1.5px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#C44FE8] text-[10px] font-bold text-white">
              A
            </div>
          </div>
          <span className="text-[11px] font-semibold">atoyo_uz</span>
          <span className="ml-auto text-sm leading-none text-[#6B6B6B]">···</span>
        </div>
        <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-[#FF6B6B] via-[#C44FE8] to-[#6B5BFF]">
          {/* A soft "photo" (sun + hills) so it reads as a picture, not a blank block */}
          <div className="absolute right-6 top-6 h-10 w-10 rounded-full bg-white/70" />
          <div className="absolute -bottom-10 -left-8 h-32 w-48 rounded-[50%] bg-white/25" />
          <div className="absolute -bottom-12 -right-8 h-36 w-52 rounded-[50%] bg-black/15" />
        </div>
        <div className="flex items-center gap-3 px-3 pt-2">
          <HeartIcon className="h-5 w-5 fill-[#FF3B30] stroke-[#FF3B30]" />
          <CommentIcon className="h-5 w-5" />
          <SendIcon className="h-5 w-5" />
          <BookmarkIcon className="ml-auto h-5 w-5" />
        </div>
        <p className="px-3 pt-1 text-[10px] font-semibold">{likesLabel}</p>
        <p className="px-3 pb-2 text-[10px]">
          <span className="font-semibold">atoyo_uz</span> Toshkent ☀️
        </p>
      </div>

      {/* Tab bar: home · search · create · reels · profile (as in the app) */}
      <div className="flex items-center justify-around border-t border-[#E8E8E8] bg-white px-2 pb-4 pt-2">
        <HomeIcon className="h-5 w-5" />
        <SearchIcon className="h-5 w-5 text-[#8A8A8A]" />
        <PlusCircleIcon className="h-5 w-5 text-[#8A8A8A]" />
        <PlayCircleIcon className="h-5 w-5 text-[#8A8A8A]" />
        <ProfileIcon className="h-5 w-5 text-[#8A8A8A]" />
      </div>
    </div>
  );
}
