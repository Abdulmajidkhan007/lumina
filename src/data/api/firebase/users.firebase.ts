/**
 * Firebase-backed IUsersApi.
 *
 * Firestore schema:
 *  - `users/{uid}` — profile doc (see UserDocFields in helpers).
 *  - `follows/{followerId}_{followeeId}` — followerId, followeeId, createdAt.
 *    Counters `followerCount`/`followingCount` on the two user docs are kept
 *    in sync transactionally.
 *  - `followRequests/{targetId}_{requesterId}` — targetId, requesterId,
 *    createdAt. Written when `followUser`/`requestFollow` targets a private
 *    profile; `acceptFollowRequest` turns it into a real `follows` edge
 *    (transactionally, alongside the counter bumps) and deletes the
 *    request doc, while `rejectFollowRequest`/`cancelFollowRequest` just
 *    delete it.
 *
 * Explore reuses the posts collection (createdAt-ordered) via FirebasePostsApi.
 */
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { IUsersApi, FollowRequestStatus } from '@/data/api/contracts';
import type { User, UserSummary, Post, UserId } from '@/types/models';
import type { Paginated, ExploreParams, CursorParams } from '@/types/api';
import { userIdSchema, userSchema, userSummarySchema } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
import { logActivity } from '@/data/services/activityLog';
import { FirebasePostsApi } from './posts.firebase';
import {
  buildValidatedList,
  fetchUserSummary,
  getBlockedUids,
  getCurrentUid,
  queryCreatedAtPage,
  queryCursorPage,
  requireCurrentUid,
  where,
  type RawDoc,
  type UserDocFields,
} from './helpers';

function usersCollection() {
  return getFirebaseFirestore().collection('users');
}

function followsCollection() {
  return getFirebaseFirestore().collection('follows');
}

function followRequestsCollection() {
  return getFirebaseFirestore().collection('followRequests');
}

function followDocId(followerId: string, followeeId: string): string {
  return `${followerId}_${followeeId}`;
}

function followRequestDocId(targetId: string, requesterId: string): string {
  return `${targetId}_${requesterId}`;
}

async function isFollowedBy(viewerUid: string | null, targetId: string): Promise<boolean> {
  if (!viewerUid || viewerUid === targetId) return false;
  const snap = await followsCollection().doc(followDocId(viewerUid, targetId)).get();
  return snap.exists();
}

interface FollowDocFields {
  followerId: string;
  followeeId: string;
  createdAt: string;
}

interface FollowRequestDocFields {
  targetId: string;
  requesterId: string;
  createdAt: string;
}

export class FirebaseUsersApi implements IUsersApi {
  private readonly postsApi = new FirebasePostsApi();

  async getUser(id: UserId): Promise<User> {
    const snap = await usersCollection().doc(id).get();
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
      website: data.website ?? null,
      isProfessional: data.isProfessional ?? false,
      birthday: data.birthday ?? null,
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
    const blocked = await getBlockedUids(getCurrentUid());
    return { items: items.filter((u) => !blocked.has(u.id)), nextCursor };
  }

  /** Follows immediately when `id` is public; files a request when it's private. */
  async followUser(id: UserId): Promise<void> {
    const targetSnap = await usersCollection().doc(id).get();
    const isPrivate = (targetSnap.data() as Partial<UserDocFields> | undefined)?.isPrivate ?? false;
    if (isPrivate) {
      await this.requestFollow(id);
      return;
    }
    await this.setFollow(id, true);
  }

  async unfollowUser(id: UserId): Promise<void> {
    await this.setFollow(id, false);
  }

  async requestFollow(id: UserId): Promise<void> {
    const uid = requireCurrentUid();
    if (uid === id) return; // never follow yourself
    if (await isFollowedBy(uid, id)) return; // already following — nothing to request
    const reqRef = followRequestsCollection().doc(followRequestDocId(id, uid));
    const existing = await reqRef.get();
    if (existing.exists()) return; // idempotent — request already pending
    const requestDoc: FollowRequestDocFields = {
      targetId: id,
      requesterId: uid,
      createdAt: new Date().toISOString(),
    };
    await reqRef.set(requestDoc);
  }

  async cancelFollowRequest(id: UserId): Promise<void> {
    const uid = requireCurrentUid();
    await followRequestsCollection().doc(followRequestDocId(id, uid)).delete();
  }

  async acceptFollowRequest(requesterId: UserId): Promise<void> {
    const uid = requireCurrentUid(); // the target approving the request
    const db = getFirebaseFirestore();
    const requestRef = followRequestsCollection().doc(followRequestDocId(uid, requesterId));
    const followRef = followsCollection().doc(followDocId(requesterId, uid));
    const followerUserRef = usersCollection().doc(requesterId);
    const followeeUserRef = usersCollection().doc(uid);

    await db.runTransaction(async (tx) => {
      const [requestSnap, followSnap, followeeSnap] = await Promise.all([
        tx.get(requestRef),
        tx.get(followRef),
        tx.get(followeeUserRef),
      ]);
      if (!requestSnap.exists()) return; // request already withdrawn — no-op

      if (!followSnap.exists() && followeeSnap.exists()) {
        const followDoc: FollowDocFields = {
          followerId: requesterId,
          followeeId: uid,
          createdAt: new Date().toISOString(),
        };
        tx.set(followRef, followDoc);
        tx.update(followeeUserRef, { followerCount: firestore.FieldValue.increment(1) });
        tx.update(followerUserRef, { followingCount: firestore.FieldValue.increment(1) });
      }
      tx.delete(requestRef);
    });
  }

  async rejectFollowRequest(requesterId: UserId): Promise<void> {
    const uid = requireCurrentUid();
    await followRequestsCollection().doc(followRequestDocId(uid, requesterId)).delete();
  }

  async getIncomingFollowRequests(params?: CursorParams): Promise<Paginated<UserSummary>> {
    const uid = requireCurrentUid();
    const { docs, nextCursor } = await queryCreatedAtPage(
      followRequestsCollection(),
      [where('targetId', '==', uid)],
      params?.cursor,
      params?.limit,
    );
    const summaries = await Promise.all(
      docs.map((raw) => {
        const data = raw.data as Partial<FollowRequestDocFields>;
        return data.requesterId ? fetchUserSummary(data.requesterId) : Promise.resolve(null);
      }),
    );
    return {
      items: summaries.filter((s): s is UserSummary => s !== null),
      nextCursor,
    };
  }

  async getFollowRequestStatus(id: UserId): Promise<FollowRequestStatus> {
    const uid = getCurrentUid();
    if (!uid || uid === id) return 'none';
    if (await isFollowedBy(uid, id)) return 'following';
    const reqSnap = await followRequestsCollection().doc(followRequestDocId(id, uid)).get();
    return reqSnap.exists() ? 'requested' : 'none';
  }

  private async setFollow(id: UserId, shouldFollow: boolean): Promise<void> {
    const uid = requireCurrentUid();
    if (uid === id) return; // never follow yourself — mirrors mock behavior
    const db = getFirebaseFirestore();
    const followRef = followsCollection().doc(followDocId(uid, id));
    const followerUserRef = usersCollection().doc(uid);
    const followeeUserRef = usersCollection().doc(id);

    await db.runTransaction(async (tx) => {
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
        tx.update(followeeUserRef, { followerCount: firestore.FieldValue.increment(1) });
        tx.update(followerUserRef, { followingCount: firestore.FieldValue.increment(1) });
      } else if (!shouldFollow && exists) {
        tx.delete(followRef);
        tx.update(followeeUserRef, { followerCount: firestore.FieldValue.increment(-1) });
        tx.update(followerUserRef, { followingCount: firestore.FieldValue.increment(-1) });
      }
    });
    void logActivity(shouldFollow ? 'follow' : 'unfollow', { targetId: id });
  }

  async getFollowers(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>> {
    return this.getFollowEdgeUsers('followeeId', id, 'followerId', params);
  }

  async getFollowing(id: UserId, params?: CursorParams): Promise<Paginated<UserSummary>> {
    return this.getFollowEdgeUsers('followerId', id, 'followeeId', params);
  }

  async blockUser(id: UserId): Promise<void> {
    const uid = requireCurrentUid();
    if (uid === id) return;
    await usersCollection().doc(uid).collection('blocked').doc(id).set({
      createdAt: new Date().toISOString(),
    });
    void logActivity('block', { targetId: id });
    // Drop any follow edges in both directions so blocked users disappear.
    await Promise.allSettled([
      this.setFollow(id, false),
      followsCollection().doc(followDocId(id, uid)).delete(),
    ]);
  }

  async unblockUser(id: UserId): Promise<void> {
    const uid = requireCurrentUid();
    await usersCollection().doc(uid).collection('blocked').doc(id).delete();
  }

  async getBlockedUsers(): Promise<UserSummary[]> {
    const uid = requireCurrentUid();
    const snap = await usersCollection().doc(uid).collection('blocked').get();
    const summaries = await Promise.all(
      snap.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => fetchUserSummary(d.id)),
    );
    return summaries.filter((s): s is UserSummary => s !== null);
  }

  async isBlocked(id: UserId): Promise<boolean> {
    const uid = getCurrentUid();
    if (!uid) return false;
    const snap = await usersCollection().doc(uid).collection('blocked').doc(id).get();
    return snap.exists();
  }

  async setRestricted(id: UserId, restricted: boolean): Promise<void> {
    const uid = requireCurrentUid();
    if (uid === id) return;
    const ref = usersCollection().doc(uid).collection('restricted').doc(id);
    if (restricted) {
      await ref.set({ createdAt: new Date().toISOString() });
    } else {
      await ref.delete();
    }
  }

  async getRestrictedUsers(): Promise<UserSummary[]> {
    const uid = requireCurrentUid();
    const snap = await usersCollection().doc(uid).collection('restricted').get();
    const summaries = await Promise.all(
      snap.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => fetchUserSummary(d.id)),
    );
    return summaries.filter((s): s is UserSummary => s !== null);
  }

  async reportContent(input: {
    targetType: 'user' | 'post' | 'comment';
    targetId: string;
    reason?: string;
  }): Promise<void> {
    const uid = requireCurrentUid();
    await getFirebaseFirestore().collection('reports').doc().set({
      reporterId: uid,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason ?? '',
      createdAt: new Date().toISOString(),
    });
    void logActivity('report', { targetType: input.targetType, targetId: input.targetId });
  }

  async getCloseFriends(): Promise<UserSummary[]> {
    const uid = requireCurrentUid();
    const snap = await usersCollection().doc(uid).collection('closeFriends').get();
    const summaries = await Promise.all(
      snap.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => fetchUserSummary(d.id)),
    );
    return summaries.filter((s): s is UserSummary => s !== null);
  }

  async setCloseFriend(id: UserId, isCloseFriend: boolean): Promise<void> {
    const uid = requireCurrentUid();
    if (uid === id) return;
    const ref = usersCollection().doc(uid).collection('closeFriends').doc(id);
    if (isCloseFriend) {
      await ref.set({ createdAt: new Date().toISOString() });
    } else {
      await ref.delete();
    }
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
