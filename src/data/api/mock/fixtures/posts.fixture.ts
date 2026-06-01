import type { Post, Media } from '@/types/models';
import { postIdSchema } from '@/schemas';
import { mutableUsers, toUserSummary } from './users.fixture';
import { createSeededRng, seededInt, seededPick } from './seed';

const rng = createSeededRng('lumina-posts-v1');

const captions = [
  'Golden hour never disappoints 🌅',
  'Lost in the details ✦',
  'Chasing light across the city',
  'Still and quiet — my kind of morning',
  'Every frame tells a story',
  'The city breathes at night',
  null,
  'Texture and shadow',
  'Found this corner on a random Tuesday',
  'Minimal. Intentional. Present.',
  null,
  'Wandering without a map',
  'Architecture as art 🏛',
  'Reflections and refractions',
  'The ordinary made extraordinary',
  'Colour theory in practice 🎨',
  null,
  'Taken on expired film — love the grain',
  'Early morning, empty streets',
  'Everything is composition',
];

const locations = [
  'Tokyo, Japan',
  'Brooklyn, New York',
  'Paris, France',
  'Kyoto, Japan',
  'Berlin, Germany',
  undefined,
  'Cape Town, South Africa',
  undefined,
  'Melbourne, Australia',
  'Lisbon, Portugal',
];

function makeMedia(index: number): Media[] {
  const imgSeed = `post-img-${index}`;
  const img: Media = {
    type: 'image',
    uri: `https://picsum.photos/seed/${imgSeed}/1080/1350`,
    width: 1080,
    height: 1350,
  };
  // Every 5th post has 2 images; every 7th has a video
  if (index % 7 === 0) {
    const video: Media = {
      type: 'video',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUri: `https://picsum.photos/seed/${imgSeed}/1080/1350`,
      width: 1080,
      height: 1920,
      durationMs: 15_000,
    };
    return [video];
  }
  if (index % 5 === 0) {
    const img2: Media = {
      type: 'image',
      uri: `https://picsum.photos/seed/${imgSeed}-b/1080/1350`,
      width: 1080,
      height: 1350,
    };
    return [img, img2];
  }
  return [img];
}

// Keep a reference to the posts array so mutations can update it
export const mutablePosts: Post[] = Array.from({ length: 30 }, (_, i) => {
  const userIndex = i % mutableUsers.length;
  const user = mutableUsers[userIndex]!;
  const captionIndex = i % captions.length;
  const locationIndex = i % locations.length;

  return {
    id: postIdSchema.parse(`post-${String(i + 1).padStart(3, '0')}`),
    author: toUserSummary(user),
    media: makeMedia(i),
    caption: captions[captionIndex] ?? null,
    likeCount: seededInt(10, 45_000, rng),
    commentCount: seededInt(0, 800, rng),
    isLikedByMe: i % 4 === 0,
    isSavedByMe: i % 7 === 0,
    createdAt: new Date(Date.now() - (30 - i) * 4 * 60 * 60 * 1000).toISOString(),
    location: locations[locationIndex],
  };
});
