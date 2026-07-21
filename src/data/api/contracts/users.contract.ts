import type { User, UserSummary, Post , UserId } from '@/types/models';
import type { Paginated, ExploreParams, CursorParams } from '@/types/api';

// ---------------------------------------------------------------------------
// Request/response types scoped to the social graph
// ---------------------------------------------------------------------------

/**
 * Relationship between the current user and another profile:
 *  - 'none'      — not following, no pending request
 *  - 'requested' — a follow request is pending target approval
 *  - 'following' — an established follow
 */
export type FollowRequestStatus = 'none' | 'requested' | 'following';

// ---------------------------------------------------------------------------
// IUsersApi — the swap boundary for user profiles and social graph
// ---------------------------------------------------------------------------

export interface IUsersApi {
  getUser(id: UserId): Promise<User>;
  /** Resolves a `@mention` handle to its profile; null when no user has that username. */
  getUserByUsername(username: string): Promise<User | null>;
  getExplore(params: ExploreParams): Promise<Paginated<Post>>;
  searchUsers(query: string, params?: CursorParams): Promise<Paginated<UserSummary>>;
  /**
   * Follows a public profile immediately. When the target is private, this
   * files a follow request instead (equivalent to calling `requestFollow`) —
   * callers never need to branch on `isPrivate` themselves.
   */
  followUser(id: UserId): Promise<void>;
  unfollowUser(id: UserId): Promise<void>;
  /** Explicitly files a follow request against a private profile. */
  requestFollow(id: UserId): Promise<void>;
  /** Withdraws a follow request the current user sent. */
  cancelFollowRequest(id: UserId): Promise<void>;
  /** Approves an incoming follow request, creating the real follow edge. */
  acceptFollowRequest(requesterId: UserId): Promise<void>;
  /** Declines an incoming follow request without following back. */
  rejectFollowRequest(requesterId: UserId): Promise<void>;
  /** Follow requests other users have sent to the current user. */
  getIncomingFollowRequests(params?: CursorParams): Promise<Paginated<UserSummary>>;
  /** The current user's relationship to profile `id`. */
  getFollowRequestStatus(id: UserId): Promise<FollowRequestStatus>;
  getFollowers(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>>;
  getFollowing(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>>;
  /** The current user's Close Friends list. */
  getCloseFriends(): Promise<UserSummary[]>;
  /** Adds or removes `id` from the current user's Close Friends. */
  setCloseFriend(id: UserId, isCloseFriend: boolean): Promise<void>;
  /** Blocks `id`: their content is hidden from the current user everywhere. */
  blockUser(id: UserId): Promise<void>;
  /** Reverses a block. */
  unblockUser(id: UserId): Promise<void>;
  /** The accounts the current user has blocked. */
  getBlockedUsers(): Promise<UserSummary[]>;
  /** Whether the current user has blocked `id`. */
  isBlocked(id: UserId): Promise<boolean>;
  /** Restricts/unrestricts `id` (a lighter block — limits their interactions). */
  setRestricted(id: UserId, restricted: boolean): Promise<void>;
  /** The accounts the current user has restricted. */
  getRestrictedUsers(): Promise<UserSummary[]>;
  /** Files a report against a user or a piece of content. */
  reportContent(input: { targetType: 'user' | 'post' | 'comment'; targetId: string; reason?: string }): Promise<void>;
}
