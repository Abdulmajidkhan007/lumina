/**
 * Typed query-key factory.
 *
 * All keys are const-asserted tuples so TanStack Query's cache matching,
 * invalidation, and prefetching all benefit from type safety.
 */

import type { PostId, UserId, ConversationId } from '@/types/models';

export const queryKeys = {
  // Feed
  feed: () => ['feed'] as const,
  feedUser: (userId: UserId) => ['feed', 'user', userId] as const,

  // Posts
  post: (id: PostId) => ['post', id] as const,
  comments: (postId: PostId, parentCommentId?: string) =>
    parentCommentId
      ? (['comments', postId, 'replies', parentCommentId] as const)
      : (['comments', postId] as const),
  savedPosts: () => ['savedPosts'] as const,

  // Stories
  storyReels: () => ['storyReels'] as const,

  // Reels
  reels: () => ['reels'] as const,
  reelsUser: (userId: UserId) => ['reels', 'user', userId] as const,

  // Explore
  explore: (query?: string) =>
    query ? (['explore', query] as const) : (['explore'] as const),

  // Hashtags
  hashtag: (tag: string) => ['hashtag', tag.toLowerCase()] as const,

  // Users
  user: (id: UserId) => ['user', id] as const,
  userByUsername: (username: string) =>
    ['user', 'byUsername', username.toLowerCase()] as const,
  followers: (id: UserId) => ['user', id, 'followers'] as const,
  following: (id: UserId) => ['user', id, 'following'] as const,
  searchUsers: (term: string) => ['searchUsers', term] as const,

  // Messaging
  conversations: () => ['conversations'] as const,
  messages: (conversationId: ConversationId) =>
    ['messages', conversationId] as const,

  // Notifications
  notifications: () => ['notifications'] as const,
} as const;

export type QueryKeys = typeof queryKeys;
