import type { Comment , PostId } from '@/types/models';
import { commentIdSchema, postIdSchema } from '@/schemas';
import { mutableUsers, toUserSummary } from './users.fixture';
import { createSeededRng, seededInt } from './seed';

const rng = createSeededRng('lumina-comments-v1');

const commentTexts = [
  'Absolutely stunning! 😍',
  'This is everything.',
  'The lighting here is incredible.',
  'Where was this taken?',
  'I need to visit this place.',
  'You have such an eye for detail.',
  'The colors are perfect 🎨',
  'Wow, this is beautiful.',
  'Love the composition!',
  'This made my day ☀️',
  'Incredible shot!',
  'I\'ve been staring at this for minutes.',
  'The mood here is unmatched.',
  'Goals 🙌',
  'Pure perfection.',
  'So much talent!',
  'Can you share your settings?',
  'This belongs in a museum.',
  'The perspective is genius.',
  'Following for more of this content 💯',
];

/** Flat list of ~60 comments spread across posts 1-30 */
export const mutableComments: Comment[] = Array.from({ length: 60 }, (_, i) => {
  const postIndex = (i % 30) + 1;
  const postId: PostId = postIdSchema.parse(`post-${String(postIndex).padStart(3, '0')}`);
  const authorIndex = (i * 3 + 1) % mutableUsers.length;
  const user = mutableUsers[authorIndex]!;
  const textIndex = i % commentTexts.length;

  // Every 10th comment is a reply to the previous comment
  const isReply = i % 10 === 0 && i > 0;
  const parentIdRaw = isReply
    ? `comment-${String(i - 1).padStart(3, '0')}`
    : undefined;

  return {
    id: commentIdSchema.parse(`comment-${String(i + 1).padStart(3, '0')}`),
    postId,
    author: toUserSummary(user),
    text: commentTexts[textIndex]!,
    likeCount: seededInt(0, 500, rng),
    isLikedByMe: i % 5 === 0,
    createdAt: new Date(Date.now() - (60 - i) * 30 * 60 * 1000).toISOString(),
    replyCount: isReply ? 0 : seededInt(0, 10, rng),
    ...(parentIdRaw !== undefined
      ? { parentId: commentIdSchema.parse(parentIdRaw) }
      : {}),
  };
});
