import type { IUsersApi } from '@/data/api/contracts';
import type { User, UserSummary, Post } from '@/types/models';
import type { UserId } from '@/types/models';
import type { Paginated, ExploreParams, CursorParams } from '@/types/api';
import { mutableUsers, toUserSummary } from './fixtures/users.fixture';
import { mutablePosts } from './fixtures/posts.fixture';
import { mockDelay } from './latency';
import { paginateArray } from './pagination';

export class MockUsersApi implements IUsersApi {
  async getUser(id: UserId): Promise<User> {
    await mockDelay();
    const user = mutableUsers.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
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

  async followUser(id: UserId): Promise<void> {
    await mockDelay();
    const user = mutableUsers.find((u) => u.id === id);
    if (user && !user.isFollowedByMe) {
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
