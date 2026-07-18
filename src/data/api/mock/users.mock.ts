import type { IUsersApi, FollowRequestStatus } from '@/data/api/contracts';
import type { User, UserSummary, Post , UserId } from '@/types/models';
import type { Paginated, ExploreParams, CursorParams } from '@/types/api';
import { currentUser, mutableUsers, toUserSummary } from './fixtures/users.fixture';
import { mutablePosts } from './fixtures/posts.fixture';
import { mockDelay } from './latency';
import { paginateArray } from './pagination';

/** In-memory pending follow requests, keyed by `${targetId}_${requesterId}`. */
interface FollowRequestRecord {
  targetId: string;
  requesterId: string;
  createdAt: string;
}

const mutableFollowRequests = new Map<string, FollowRequestRecord>();

function requestKey(targetId: string, requesterId: string): string {
  return `${targetId}_${requesterId}`;
}

export class MockUsersApi implements IUsersApi {
  async getUser(id: UserId): Promise<User> {
    await mockDelay();
    const user = mutableUsers.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
  }

  /** Resolves a `@mention` handle (case-insensitive) to its profile, or null when no match exists. */
  async getUserByUsername(username: string): Promise<User | null> {
    await mockDelay();
    const term = username.trim().toLowerCase();
    if (term.length === 0) return null;
    const user = mutableUsers.find((u) => u.username.toLowerCase() === term);
    return user ?? null;
  }

  async getExplore(params: ExploreParams): Promise<Paginated<Post>> {
    await mockDelay();
    const filtered =
      params.query && params.query.trim().length > 0
        ? mutablePosts.filter(
            (p) =>
              p.caption?.toLowerCase().includes(params.query!.toLowerCase()) ||
              p.author.username.toLowerCase().includes(params.query!.toLowerCase()),
          )
        : mutablePosts;
    return paginateArray(filtered, params.cursor, params.limit);
  }

  async searchUsers(query: string, params?: CursorParams): Promise<Paginated<UserSummary>> {
    await mockDelay();
    const q = query.toLowerCase();
    const matched = mutableUsers
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q),
      )
      .map(toUserSummary);
    return paginateArray(matched, params?.cursor, params?.limit);
  }

  /** Follows immediately when `id` is public; files a request when it's private. */
  async followUser(id: UserId): Promise<void> {
    await mockDelay();
    const user = mutableUsers.find((u) => u.id === id);
    if (!user) return;
    if (user.isPrivate) {
      this.addFollowRequest(id);
      return;
    }
    if (!user.isFollowedByMe) {
      user.isFollowedByMe = true;
      user.followerCount += 1;
    }
  }

  async unfollowUser(id: UserId): Promise<void> {
    await mockDelay();
    const user = mutableUsers.find((u) => u.id === id);
    if (user && user.isFollowedByMe) {
      user.isFollowedByMe = false;
      user.followerCount = Math.max(0, user.followerCount - 1);
    }
  }

  async requestFollow(id: UserId): Promise<void> {
    await mockDelay();
    this.addFollowRequest(id);
  }

  /** Pure helper shared by `followUser`/`requestFollow` — no artificial delay of its own. */
  private addFollowRequest(id: UserId): void {
    const target = mutableUsers.find((u) => u.id === id);
    if (!target || target.id === currentUser.id || target.isFollowedByMe) return;
    const key = requestKey(id, currentUser.id);
    if (!mutableFollowRequests.has(key)) {
      mutableFollowRequests.set(key, {
        targetId: id,
        requesterId: currentUser.id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  async cancelFollowRequest(id: UserId): Promise<void> {
    await mockDelay();
    mutableFollowRequests.delete(requestKey(id, currentUser.id));
  }

  async acceptFollowRequest(requesterId: UserId): Promise<void> {
    await mockDelay();
    const key = requestKey(currentUser.id, requesterId);
    if (!mutableFollowRequests.has(key)) return;
    mutableFollowRequests.delete(key);
    const me = mutableUsers.find((u) => u.id === currentUser.id);
    const requester = mutableUsers.find((u) => u.id === requesterId);
    if (me) me.followerCount += 1;
    if (requester) requester.followingCount += 1;
  }

  async rejectFollowRequest(requesterId: UserId): Promise<void> {
    await mockDelay();
    mutableFollowRequests.delete(requestKey(currentUser.id, requesterId));
  }

  async getIncomingFollowRequests(params?: CursorParams): Promise<Paginated<UserSummary>> {
    await mockDelay();
    const requesters = [...mutableFollowRequests.values()]
      .filter((r) => r.targetId === currentUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => mutableUsers.find((u) => u.id === r.requesterId))
      .filter((u): u is User => u !== undefined)
      .map(toUserSummary);
    return paginateArray(requesters, params?.cursor, params?.limit);
  }

  async getFollowRequestStatus(id: UserId): Promise<FollowRequestStatus> {
    await mockDelay();
    if (id === currentUser.id) return 'none';
    const user = mutableUsers.find((u) => u.id === id);
    if (user?.isFollowedByMe) return 'following';
    return mutableFollowRequests.has(requestKey(id, currentUser.id)) ? 'requested' : 'none';
  }

  async getFollowers(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>> {
    await mockDelay();
    // Return users who follow the given user (those with isFollowedByMe=true for
    // the current user, or a deterministic subset for others)
    const user = mutableUsers.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    const followers = mutableUsers
      .filter((u) => u.id !== id)
      .slice(0, user.followerCount % mutableUsers.length + 3)
      .map(toUserSummary);
    return paginateArray(followers, params?.cursor, params?.limit);
  }

  async getFollowing(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>> {
    await mockDelay();
    const user = mutableUsers.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    const following = mutableUsers
      .filter((u) => u.id !== id && u.isFollowedByMe)
      .map(toUserSummary);
    return paginateArray(following, params?.cursor, params?.limit);
  }
}
