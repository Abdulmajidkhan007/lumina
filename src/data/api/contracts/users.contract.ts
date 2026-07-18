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
}
