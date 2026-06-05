import type { Notification } from '@/types/models';
import { notificationIdSchema, postIdSchema } from '@/schemas';
import { mutableUsers, toUserSummary } from './users.fixture';

function makeTimestamp(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function notifId(n: number): ReturnType<typeof notificationIdSchema.parse> {
  return notificationIdSchema.parse(`notif-${String(n).padStart(3, '0')}`);
}

function postThumb(postIndex: number) {
  return {
    postId: postIdSchema.parse(`post-${String(postIndex).padStart(3, '0')}`),
    thumbnailUri: `https://picsum.photos/seed/post-img-${postIndex}/200/200`,
  };
}

export const mutableNotifications: Notification[] = [
  {
    id: notifId(1),
    type: 'like',
    actor: toUserSummary(mutableUsers[1]!),
    postPreview: postThumb(1),
    createdAt: makeTimestamp(0.5),
    read: false,
  },
  {
    id: notifId(2),
    type: 'follow',
    actor: toUserSummary(mutableUsers[2]!),
    createdAt: makeTimestamp(1),
    read: false,
  },
  {
    id: notifId(3),
    type: 'comment',
    actor: toUserSummary(mutableUsers[3]!),
    postPreview: postThumb(2),
    commentText: 'The lighting here is incredible!',
    createdAt: makeTimestamp(2),
    read: false,
  },
  {
    id: notifId(4),
    type: 'like',
    actor: toUserSummary(mutableUsers[4]!),
    postPreview: postThumb(3),
    createdAt: makeTimestamp(3),
    read: false,
  },
  {
    id: notifId(5),
    type: 'mention',
    actor: toUserSummary(mutableUsers[5]!),
    postPreview: postThumb(4),
    mentionContext: 'Just like @lumina_you always says — let the light do the work.',
    createdAt: makeTimestamp(5),
    read: true,
  },
  {
    id: notifId(6),
    type: 'like',
    actor: toUserSummary(mutableUsers[6]!),
    postPreview: postThumb(5),
    createdAt: makeTimestamp(8),
    read: true,
  },
  {
    id: notifId(7),
    type: 'follow',
    actor: toUserSummary(mutableUsers[7]!),
    createdAt: makeTimestamp(12),
    read: true,
  },
  {
    id: notifId(8),
    type: 'comment',
    actor: toUserSummary(mutableUsers[8]!),
    postPreview: postThumb(6),
    commentText: 'This is goals 🙌',
    createdAt: makeTimestamp(18),
    read: true,
  },
  {
    id: notifId(9),
    type: 'like',
    actor: toUserSummary(mutableUsers[9]!),
    postPreview: postThumb(7),
    createdAt: makeTimestamp(24),
    read: true,
  },
  {
    id: notifId(10),
    type: 'mention',
    actor: toUserSummary(mutableUsers[10]!),
    postPreview: postThumb(8),
    mentionContext: 'Inspired by @lumina_you for this one.',
    createdAt: makeTimestamp(36),
    read: true,
  },
  {
    id: notifId(11),
    type: 'like',
    actor: toUserSummary(mutableUsers[11]!),
    postPreview: postThumb(9),
    createdAt: makeTimestamp(48),
    read: true,
  },
  {
    id: notifId(12),
    type: 'follow',
    actor: toUserSummary(mutableUsers[1]!),
    createdAt: makeTimestamp(72),
    read: true,
  },
  {
    id: notifId(13),
    type: 'comment',
    actor: toUserSummary(mutableUsers[2]!),
    postPreview: postThumb(10),
    commentText: 'Love the composition!',
    createdAt: makeTimestamp(96),
    read: true,
  },
  {
    id: notifId(14),
    type: 'like',
    actor: toUserSummary(mutableUsers[3]!),
    postPreview: postThumb(11),
    createdAt: makeTimestamp(120),
    read: true,
  },
  {
    id: notifId(15),
    type: 'like',
    actor: toUserSummary(mutableUsers[4]!),
    postPreview: postThumb(12),
    createdAt: makeTimestamp(144),
    read: true,
  },
];
