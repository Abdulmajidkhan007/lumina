import type { Reel } from '@/types/models';
import { reelIdSchema } from '@/schemas';
import { mutableUsers, toUserSummary } from './users.fixture';
import { createSeededRng, seededInt } from './seed';

const rng = createSeededRng('lumina-reels-v1');

const SAMPLE_VIDEO_URI =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const reelCaptions = [
  'POV: Golden hour in the city 🌆',
  'One take, no edits.',
  'This spot took 3 hours to find.',
  'Watch till the end 👀',
  null,
  'The transition at 0:08 😍',
  'Shot on a Tuesday, feels like a Friday.',
  'Morning light hits different.',
  null,
  'You asked for BTS — here it is.',
  'Just vibes.',
  null,
  '48h in Tokyo 🇯🇵',
  'What a world we live in.',
  'This is why I love my job.',
  null,
  'Silent reel, let the visuals talk.',
  'Unplanned spontaneous magical moments.',
  null,
  'Behind every great shot: 300 bad ones.',
];

const audioTitles = [
  'Dreams - Fleetwood Mac',
  'Golden - Harry Styles',
  'Original Audio',
  'Blinding Lights - The Weeknd',
  undefined,
  'Montero - Lil Nas X',
  'Original Audio',
  'Heat Waves - Glass Animals',
  undefined,
  'Levitating - Dua Lipa',
];

export const mutableReels: Reel[] = Array.from({ length: 20 }, (_, i) => {
  const authorIndex = i % mutableUsers.length;
  const user = mutableUsers[authorIndex]!;
  const captionIndex = i % reelCaptions.length;
  const audioIndex = i % audioTitles.length;

  return {
    id: reelIdSchema.parse(`reel-${String(i + 1).padStart(3, '0')}`),
    author: toUserSummary(user),
    video: {
      type: 'video',
      uri: SAMPLE_VIDEO_URI,
      thumbnailUri: `https://picsum.photos/seed/reel-${i + 1}/1080/1920`,
      width: 1080,
      height: 1920,
      durationMs: seededInt(5_000, 60_000, rng),
    },
    caption: reelCaptions[captionIndex] ?? null,
    likeCount: seededInt(500, 250_000, rng),
    commentCount: seededInt(10, 5_000, rng),
    shareCount: seededInt(5, 20_000, rng),
    isLikedByMe: i % 3 === 0,
    isSavedByMe: i % 8 === 0,
    audioTitle: audioTitles[audioIndex],
    createdAt: new Date(Date.now() - (20 - i) * 6 * 60 * 60 * 1000).toISOString(),
  };
});
