import type { User, UserSummary, Post , UserId } from '@/types/models';
import type { Paginated, ExploreParams, CursorParams } from '@/types/api';

// ---------------------------------------------------------------------------
// IUsersApi — the swap boundary for user profiles and social graph
// ---------------------------------------------------------------------------

export interface IUsersApi {
  getUser(id: UserId): Promise<User>;
  getExplore(params: ExploreParams): Promise<Paginated<Post>>;
  searchUsers(query: string, params?: CursorParams): Promise<Paginated<UserSummary>>;
  followUser(id: UserId): Promise<void>;
  unfollowUser(id: UserId): Promise<void>;
  getFollowers(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>>;
  getFollowing(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>>;
}
