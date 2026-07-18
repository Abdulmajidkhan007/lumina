/**
 * Firebase-backed IUsersApi.
 *
 * Firestore schema:
 *  - `users/{uid}` — profile doc (see UserDocFields in helpers).
 *  - `follows/{followerId}_{followeeId}` — followerId, followeeId, createdAt.
 *    Counters `followerCount`/`followingCount` on the two user docs are kept
 *    in sync transactionally.
 *
 * Explore reuses the posts collection (createdAt-ordered) via FirebasePostsApi.
 */
import {
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  where,
} from '@react-native-firebase/firestore';
import type { IUsersApi } from '@/data/api/contracts';
import type { User, UserSummary, Post, UserId } from '@/types/models';
import type { Paginated, ExploreParams, CursorParams } from '@/types/api';
import { userIdSchema, userSchema, userSummarySchema } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
import { FirebasePostsApi } from './posts.firebase';
import {
  buildValidatedList,
  fetchUserSummary,
  getCurrentUid,
  queryCreatedAtPage,
  queryCursorPage,
  requireCurrentUid,
  type RawDoc,
  type UserDocFields,
} from './helpers';

function usersCollection() {
  return collection(getFirebaseFirestore(), 'users');
}

function followsCollection() {
  return collection(getFirebaseFirestore(), 'follows');
}

function followDocId(followerId: string, followeeId: string): string {
  return `${followerId}_${followeeId}`;
}

async function isFollowedBy(viewerUid: string | null, targetId: string): Promise<boolean> {
  if (!viewerUid || viewerUid === targetId) return false;
  const snap = await getDoc(doc(followsCollection(), followDocId(viewerUid, targetId)));
  return snap.exists();
}

interface FollowDocFields {
  followerId: string;
  followeeId: string;
  createdAt: string;
}

export class FirebaseUsersApi implements IUsersApi {
  private readonly postsApi = new FirebasePostsApi();

  async getUser(id: UserId): Promise<User> {
    const snap = await getDoc(doc(usersCollection(), id));
    if (!snap.exists()) {
      throw new Error(`User ${id} not found`);
    }
    const data = snap.data() as Partial<UserDocFields>;
    const viewerUid = getCurrentUid();
    const candidate = {
      id: snap.id,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl ?? null,
      bio: data.bio ?? null,
      isVerified: data.isVerified ?? false,
      isPrivate: data.isPrivate ?? false,
      followerCount: data.followerCount ?? 0,
      followingCount: data.followingCount ?? 0,
      postCount: data.postCount ?? 0,
      isFollowedByMe: await isFollowedBy(viewerUid, snap.id),
      isMe: viewerUid === snap.id,
      createdAt: data.createdAt,
    };
    return userSchema.parse(candidate);
  }

  /** Resolves a `@mention` handle (case-insensitive) to its profile, or null when no match exists. */
  async getUserByUsername(username: string): Promise<User | null> {
    const term = username.trim().toLowerCase();
    if (term.length === 0) return null;
    const { docs } = await queryCursorPage(
      usersCollection(),
      [where('usernameLower', '==', term)],
      'usernameLower',
      'asc',
      undefined,
      1,
    );
    const match = docs[0];
    if (!match) return null;
    return this.getUser(userIdSchema.parse(match.id));
  }

  async getExplore(params: ExploreParams): Promise<Paginated<Post>> {
    // Explore = the global post pool; same shape as the feed without a user filter.
    return this.postsApi.getFeed({ cursor: params.cursor, limit: params.limit });
  }

  async searchUsers(searchQuery: string, params?: CursorParams): Promise<Paginated<UserSummary>> {
    const term = searchQuery.trim().toLowerCase();
    if (term.length === 0) {
      return { items: [], nextCursor: null };
    }
    const { docs, nextCursor } = await queryCursorPage(
      usersCollection(),
      [where('usernameLower', '>=', term), where('usernameLower', '<=', `${term}`)],
      'usernameLower',
      'asc',
      params?.cursor,
      params?.limit,
    );
    const items = await buildValidatedList(
      docs,
      (raw: RawDoc) => {
        const data = raw.data as Partial<UserDocFields>;
        return {
          id: raw.id,
          username: data.username,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl ?? null,
          isVerified: data.isVerified ?? false,
        };
      },
      userSummarySchema,
    );
    return { items, nextCursor };
  }

  async followUser(id: UserId): Promise<void> {
    await this.setFollow(id, true);
  }

  async unfollowUser(id: UserId): Promise<void> {
    await this.setFollow(id, false);
  }

  private async setFollow(id: UserId, shouldFollow: boolean): Promise<void> {
    const uid = requireCurrentUid();
    if (uid === id) return; // never follow yourself — mirrors mock behavior
    const firestore = getFirebaseFirestore();
    const followRef = doc(followsCollection(), followDocId(uid, id));
    const followerUserRef = doc(usersCollection(), uid);
    const followeeUserRef = doc(usersCollection(), id);

    await runTransaction(firestore, async (tx) => {
      const [followSnap, followeeSnap] = await Promise.all([
        tx.get(followRef),
        tx.get(followeeUserRef),
      ]);
      if (!followeeSnap.exists()) return; // target vanished — silent no-op
      const exists = followSnap.exists();

      if (shouldFollow && !exists) {
        const followDoc: FollowDocFields = {
          followerId: uid,
          followeeId: id,
          createdAt: new Date().toISOString(),
        };
        tx.set(followRef, followDoc);
        tx.update(followeeUserRef, { followerCount: increment(1) });
        tx.update(followerUserRef, { followingCount: increment(1) });
      } else if (!shouldFollow && exists) {
        tx.delete(followRef);
        tx.update(followeeUserRef, { followerCount: increment(-1) });
        tx.update(followerUserRef, { followingCount: increment(-1) });
      }
    });
  }

  async getFollowers(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>> {
    return this.getFollowEdgeUsers('followeeId', id, 'followerId', params);
  }

  async getFollowing(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>> {
    return this.getFollowEdgeUsers('followerId', id, 'followeeId', params);
  }

  /** Pages the `follows` edge collection, then resolves the opposite side to summaries. */
  private async getFollowEdgeUsers(
    matchField: 'followerId' | 'followeeId',
    matchValue: string,
    resolveField: 'followerId' | 'followeeId',
    params?: CursorParams,
  ): Promise<Paginated<UserSummary>> {
    const { docs, nextCursor } = await queryCreatedAtPage(
      followsCollection(),
      [where(matchField, '==', matchValue)],
      params?.cursor,
      params?.limit,
    );
    const summaries = await Promise.all(
      docs.map((raw) => {
        const data = raw.data as Partial<FollowDocFields>;
        const targetId = data[resolveField];
        return targetId ? fetchUserSummary(targetId) : Promise.resolve(null);
      }),
    );
    return {
      items: summaries.filter((s): s is UserSummary => s !== null),
      nextCursor,
    };
  }
}
