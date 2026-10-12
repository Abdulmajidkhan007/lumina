/**
 * Firebase-backed IPostsApi.
 *
 * Firestore schema:
 *  - `posts/{postId}` — authorId, author (denormalized UserSummary embed),
 *    media, caption, hashtags (lowercased, extracted from caption via
 *    `extractHashtags` — powers `getPostsByHashtag`'s `array-contains` query),
 *    likeCount, commentCount, createdAt (ISO string), location?.
 *    - `posts/{postId}/likes/{uid}` — membership marker; existence = liked.
 *      `likeCount` on the parent doc is kept in sync via FieldValue.increment.
 *    - `posts/{postId}/saves/{uid}` — membership marker; existence = saved.
 *      (No counter — Post has no public save count.)
 *    - `posts/{postId}/comments/{commentId}` — postId, authorId, author embed,
 *      text, likeCount, createdAt, replyCount, parentId (string | null; stored
 *      as null rather than omitted so top-level comments can be queried with
 *      `where('parentId', '==', null)`).
 *      - `posts/{postId}/comments/{commentId}/likes/{uid}` — membership
 *        marker; existence = liked. `likeCount` on the comment doc is kept
 *        in sync the same way as post likes.
 *  - `users/{uid}/saves/{postId}` — per-user save index (postId, createdAt).
 *    Mirrors `posts/{postId}/saves/{uid}` but keyed the other way round so
 *    getSavedPosts can page through "my saves" ordered by save time.
 *
 *  - `posts/{postId}.collab` — { uid, status: 'pending'|'accepted'|'declined',
 *    user (UserSummary) }. Written as 'pending' with the post; only the
 *    invited uid can flip it to accepted/declined (rules). The post shows as
 *    "A and B" and on B's grid only once accepted (see utils/collab.ts).
 *    The legacy `collaborators` array (written without consent) is ignored.
 *    The invite reaches B as a `collab_invite` notification.
 *
 * `createPost` uploads any local-URI media to Cloud Storage
 * (`posts/{uid}/{timestamp}_{index}`) via `uploadMedia`, then writes the
 * post doc with the resulting download URLs and increments the author's
 * `postCount`.
 */
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { IPostsApi, AddCommentInput, CreatePostInput } from '@/data/api/contracts';
import type { Post, Comment, PostId, CommentId, UserId } from '@/types/models';
import type { Paginated, FeedParams, CommentParams } from '@/types/api';
import { postSchema, commentSchema } from '@/schemas';
import type { Media } from '@/schemas';
import type { UserSummary } from '@/types/models';
import { extractHashtags } from '@/utils/richText';
import {
  canRespondToCollab,
  mergeCollabPosts,
  parseCollab,
  visibleCollaborators,
  type CollabField,
} from '@/utils/collab';
import { getFirebaseFirestore } from '@/lib/firebase';
import { logActivity } from '@/data/services/activityLog';
import {
  buildValidatedList,
  decodeCursor,
  fetchUserSummary,
  getBlockedUids,
  getMembershipFlags,
  queryAllWhere,
  queryCreatedAtPage,
  requireCurrentUid,
  getCurrentUid,
  setMembershipFlag,
  where,
  withReadableErrors,
  type RawDoc,
} from './helpers';
import { uploadMedia } from './upload';

interface PostDocFields {
  authorId: string;
  author: UserSummary;
  media: Media[];
  caption: string | null;
  /** Lowercased hashtags extracted from `caption` (see `extractHashtags`); indexed for `getPostsByHashtag`. */
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  location?: string;
  taggedUsers?: UserSummary[];
  /** Legacy, unconfirmed co-authors — never displayed. */
  collaborators?: UserSummary[];
  collab?: CollabField<UserSummary>;
  archivedAt?: string;
}

interface CommentDocFields {
  postId: string;
  authorId: string;
  author: UserSummary;
  text: string;
  likeCount: number;
  createdAt: string;
  replyCount: number;
  parentId: string | null;
  isPinned?: boolean;
}

function postsCollection() {
  return getFirebaseFirestore().collection('posts');
}

function postDocRef(id: string) {
  return getFirebaseFirestore().collection('posts').doc(id);
}

function commentsCollection(postId: string) {
  return postDocRef(postId).collection('comments');
}

function commentDocRef(postId: string, commentId: string) {
  return commentsCollection(postId).doc(commentId);
}

function savesCollection(uid: string) {
  return getFirebaseFirestore().collection('users').doc(uid).collection('saves');
}

async function buildPostCandidate(raw: RawDoc, viewerUid: string | null): Promise<unknown> {
  const data = raw.data as Partial<PostDocFields>;
  const [isLikedByMe, isSavedByMe] = await getMembershipFlags(
    postDocRef(raw.id),
    ['likes', 'saves'],
    viewerUid,
  );
  const collaborators = visibleCollaborators(data);
  return {
    id: raw.id,
    author: data.author,
    media: data.media,
    caption: data.caption ?? null,
    likeCount: data.likeCount ?? 0,
    commentCount: data.commentCount ?? 0,
    isLikedByMe,
    isSavedByMe,
    createdAt: data.createdAt,
    ...(data.location ? { location: data.location } : {}),
    ...(data.taggedUsers ? { taggedUsers: data.taggedUsers } : {}),
    ...(collaborators ? { collaborators } : {}),
    ...(data.archivedAt ? { archivedAt: data.archivedAt } : {}),
  };
}

function notificationsCollection(uid: string) {
  return getFirebaseFirestore().collection('users').doc(uid).collection('notifications');
}

/** A small image for notifications: the first image, or a video's poster/uri. */
function previewUri(media: Media[]): string | null {
  const first = media[0];
  if (!first) return null;
  return first.type === 'video' ? first.thumbnailUri ?? first.uri : first.uri;
}

async function buildCommentCandidate(
  raw: RawDoc,
  postId: string,
  viewerUid: string | null,
): Promise<unknown> {
  const data = raw.data as Partial<CommentDocFields>;
  const [isLikedByMe] = await getMembershipFlags(
    commentDocRef(postId, raw.id),
    ['likes'],
    viewerUid,
  );
  return {
    id: raw.id,
    postId: data.postId,
    author: data.author,
    text: data.text,
    likeCount: data.likeCount ?? 0,
    isLikedByMe,
    createdAt: data.createdAt,
    replyCount: data.replyCount ?? 0,
    ...(data.parentId ? { parentId: data.parentId } : {}),
    ...(data.isPinned ? { isPinned: true } : {}),
  };
}

/** Resolves user ids to denormalized summaries, dropping any that don't exist. */
async function resolveSummaries(ids: UserId[] | undefined): Promise<UserSummary[] | undefined> {
  if (!ids || ids.length === 0) return undefined;
  const resolved = await Promise.all(ids.map((id) => fetchUserSummary(id)));
  const summaries = resolved.filter((s): s is UserSummary => s !== null);
  return summaries.length > 0 ? summaries : undefined;
}

export class FirebasePostsApi implements IPostsApi {
  async getFeed(params: FeedParams): Promise<Paginated<Post>> {
    if (params.userId) {
      const page = await this.profileGridPage(params.userId, params);
      const blocked = await getBlockedUids(getCurrentUid());
      return { ...page, items: page.items.filter((p) => !blocked.has(p.author.id)) };
    }
    return withReadableErrors('feed', async () => {
      const { docs, nextCursor } = await queryCreatedAtPage(
        postsCollection(),
        [],
        params.cursor,
        params.limit,
      );
      const viewerUid = getCurrentUid();
      const [built, blocked] = await Promise.all([
        buildValidatedList(docs, (raw) => buildPostCandidate(raw, viewerUid), postSchema),
        getBlockedUids(viewerUid),
      ]);
      // Archived posts are excluded from the feed/grid (filtered in-memory so
      // no extra composite index is needed for the "field-absent" case), as
      // are posts from accounts the viewer has blocked.
      const items = built.filter((p) => p.archivedAt === undefined && !blocked.has(p.author.id));
      return { items, nextCursor };
    });
  }

  async getPostsByHashtag(tag: string, params: FeedParams): Promise<Paginated<Post>> {
    return withReadableErrors('hashtag posts', async () => {
      const { docs, nextCursor } = await queryCreatedAtPage(
        postsCollection(),
        [where('hashtags', 'array-contains', tag.toLowerCase())],
        params.cursor,
        params.limit,
      );
      const viewerUid = getCurrentUid();
      const items = await buildValidatedList(
        docs,
        (raw) => buildPostCandidate(raw, viewerUid),
        postSchema,
      );
      return { items, nextCursor };
    });
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    const uid = requireCurrentUid();
    const author = await fetchUserSummary(uid);
    if (!author) {
      throw new Error('Current user profile not found');
    }
    const now = Date.now();
    const media: Media[] = await Promise.all(
      input.media.map(async (item, i): Promise<Media> => {
        const uri = item.uri.startsWith('http')
          ? item.uri
          : await uploadMedia(item.uri, `posts/${uid}/${now}_${i}`);
        return item.type === 'video'
          ? {
              type: 'video',
              uri,
              width: item.width ?? 1080,
              height: item.height ?? 1080,
              ...(item.durationMs !== undefined ? { durationMs: item.durationMs } : {}),
            }
          : {
              type: 'image',
              uri,
              width: item.width ?? 1080,
              height: item.height ?? 1080,
            };
      }),
    );

    const createdAt = new Date(now).toISOString();
    // One collaborator, never yourself; they must accept before it shows.
    const collabId = input.collaboratorIds?.find((id) => id !== uid);
    const [taggedUsers, collabUser] = await Promise.all([
      resolveSummaries(input.taggedUserIds),
      collabId ? fetchUserSummary(collabId) : Promise.resolve(null),
    ]);
    const collab: CollabField<UserSummary> | undefined = collabUser
      ? { uid: collabUser.id, status: 'pending', user: collabUser }
      : undefined;
    const newRef = postsCollection().doc();
    const postDoc: PostDocFields = {
      authorId: uid,
      author,
      media,
      caption: input.caption.length > 0 ? input.caption : null,
      hashtags: extractHashtags(input.caption),
      likeCount: 0,
      commentCount: 0,
      createdAt,
      ...(input.location ? { location: input.location } : {}),
      ...(taggedUsers ? { taggedUsers } : {}),
      ...(collab ? { collab } : {}),
    };
    await newRef.set(postDoc);
    const thumbnailUri = previewUri(media);
    if (collab && thumbnailUri) {
      // Best effort — the post is already live under the author alone.
      await notificationsCollection(collab.uid)
        .add({
          type: 'collab_invite',
          actor: author,
          postPreview: { postId: newRef.id, thumbnailUri },
          createdAt,
          read: false,
        })
        .catch((e: unknown) => console.warn('[posts] collab invite not sent', e));
    }
    // A post that is one video is also a reel — the Reels tab reads `reels/`,
    // which nothing used to write. Same id, so deleting the post removes it.
    const [onlyMedia] = media;
    if (media.length === 1 && onlyMedia?.type === 'video') {
      await getFirebaseFirestore().collection('reels').doc(newRef.id).set({
        authorId: uid,
        author,
        video: onlyMedia,
        caption: postDoc.caption,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        createdAt,
      });
    }
    await getFirebaseFirestore()
      .collection('users')
      .doc(uid)
      .update({
        postCount: firestore.FieldValue.increment(1),
      });
    void logActivity('post_create', { postId: newRef.id });

    return postSchema.parse({
      id: newRef.id,
      author,
      media,
      caption: postDoc.caption,
      likeCount: 0,
      commentCount: 0,
      isLikedByMe: false,
      isSavedByMe: false,
      createdAt,
      ...(input.location ? { location: input.location } : {}),
      ...(taggedUsers ? { taggedUsers } : {}),
    });
  }

  async respondToCollab(id: PostId, accept: boolean): Promise<void> {
    const uid = requireCurrentUid();
    const ref = postDocRef(id);
    await getFirebaseFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as Partial<PostDocFields> | undefined;
      if (!snap.exists() || !data) throw new Error('This post no longer exists.');
      const collab = parseCollab(data.collab);
      if (!collab || !canRespondToCollab(data, uid)) {
        throw new Error('This invite was already answered.');
      }
      tx.update(ref, { collab: { ...collab, status: accept ? 'accepted' : 'declined' } });
    });
  }

  async getPost(id: PostId): Promise<Post> {
    const snap = await postDocRef(id).get();
    if (!snap.exists()) {
      throw new Error(`Post ${id} not found`);
    }
    const candidate = await buildPostCandidate(
      { id: snap.id, data: snap.data() ?? {} },
      getCurrentUid(),
    );
    return postSchema.parse(candidate);
  }

  async likePost(id: PostId): Promise<void> {
    await this.setLike(id, true);
  }

  async unlikePost(id: PostId): Promise<void> {
    await this.setLike(id, false);
  }

  private async setLike(id: PostId, liked: boolean): Promise<void> {
    await setMembershipFlag({
      parentRef: postDocRef(id),
      subcollection: 'likes',
      uid: requireCurrentUid(),
      shouldExist: liked,
      counterField: 'likeCount',
    });
  }

  async savePost(id: PostId): Promise<void> {
    await this.setSave(id, true);
  }

  async unsavePost(id: PostId): Promise<void> {
    await this.setSave(id, false);
  }

  private async setSave(id: PostId, saved: boolean): Promise<void> {
    const uid = requireCurrentUid();
    await setMembershipFlag({
      parentRef: postDocRef(id),
      subcollection: 'saves',
      uid,
      shouldExist: saved,
    });
    // Mirror into `users/{uid}/saves/{postId}` — a per-user index that lets
    // getSavedPosts page through "my saves" ordered by save time, which the
    // `posts/{id}/saves/{uid}` marker above can't do efficiently.
    const markerRef = savesCollection(uid).doc(id);
    if (saved) {
      await markerRef.set({ postId: id, createdAt: new Date().toISOString() });
    } else {
      await markerRef.delete();
    }
  }

  async getComments(params: CommentParams): Promise<Paginated<Comment>> {
    // Index-free: filter by parentId only (equality — no composite index),
    // then sort newest-first client-side. Avoids "failed-precondition"
    // errors when the comments composite index isn't deployed.
    const docs = (
      await queryAllWhere(commentsCollection(params.postId), [
        where('parentId', '==', params.parentCommentId ?? null),
      ])
    ).sort((a, b) =>
      String((b.data as { createdAt?: string }).createdAt ?? '').localeCompare(
        String((a.data as { createdAt?: string }).createdAt ?? ''),
      ),
    );
    const viewerUid = getCurrentUid();
    const items = await buildValidatedList(
      docs,
      (raw) => buildCommentCandidate(raw, params.postId, viewerUid),
      commentSchema,
    );
    return { items, nextCursor: null };
  }

  async addComment(input: AddCommentInput): Promise<Comment> {
    const uid = requireCurrentUid();
    const author = await fetchUserSummary(uid);
    if (!author) {
      throw new Error('Current user profile not found');
    }
    const now = new Date().toISOString();
    const newRef = commentsCollection(input.postId).doc();
    const commentDoc: CommentDocFields = {
      postId: input.postId,
      authorId: uid,
      author,
      text: input.text,
      likeCount: 0,
      createdAt: now,
      replyCount: 0,
      parentId: input.parentCommentId ?? null,
    };
    await newRef.set(commentDoc);
    await postDocRef(input.postId).update({ commentCount: firestore.FieldValue.increment(1) });

    return commentSchema.parse({
      id: newRef.id,
      postId: input.postId,
      author,
      text: input.text,
      likeCount: 0,
      isLikedByMe: false,
      createdAt: now,
      replyCount: 0,
      ...(input.parentCommentId !== undefined ? { parentId: input.parentCommentId } : {}),
    });
  }

  async likeComment(postId: PostId, commentId: CommentId): Promise<void> {
    await this.setCommentLike(postId, commentId, true);
  }

  async unlikeComment(postId: PostId, commentId: CommentId): Promise<void> {
    await this.setCommentLike(postId, commentId, false);
  }

  private async setCommentLike(
    postId: PostId,
    commentId: CommentId,
    liked: boolean,
  ): Promise<void> {
    await setMembershipFlag({
      parentRef: commentDocRef(postId, commentId),
      subcollection: 'likes',
      uid: requireCurrentUid(),
      shouldExist: liked,
      counterField: 'likeCount',
    });
  }

  /** Verifies ownership before deleting; decrements the author's `postCount`. */
  async deletePost(id: PostId): Promise<void> {
    const uid = requireCurrentUid();
    const ref = postDocRef(id);
    const snap = await ref.get();
    if (!snap.exists()) {
      throw new Error(`Post ${id} not found`);
    }
    const data = snap.data() as Partial<PostDocFields>;
    if (data.authorId !== uid) {
      throw new Error('You can only delete your own posts.');
    }
    await ref.delete();
    // Its reel twin. Only for single-video posts: rules read the doc's
    // authorId, so deleting a reel that never existed is denied.
    if (data.media?.length === 1 && data.media[0]?.type === 'video') {
      await getFirebaseFirestore()
        .collection('reels')
        .doc(id)
        .delete()
        .catch((e: unknown) => console.warn('[posts] reel twin not deleted', e));
    }
    await getFirebaseFirestore()
      .collection('users')
      .doc(uid)
      .update({
        postCount: firestore.FieldValue.increment(-1),
      });
  }

  async getSavedPosts(params: FeedParams): Promise<Paginated<Post>> {
    return withReadableErrors('saved posts', async () => {
      const uid = requireCurrentUid();
      const { docs, nextCursor } = await queryCreatedAtPage(
        savesCollection(uid),
        [],
        params.cursor,
        params.limit,
      );
      const postSnaps = await Promise.all(docs.map((raw) => postDocRef(raw.id).get()));
      const rawPosts: RawDoc[] = postSnaps
        .filter((snap) => snap.exists())
        .map((snap) => ({ id: snap.id, data: snap.data() ?? {} }));
      const viewerUid = getCurrentUid();
      const items = await buildValidatedList(
        rawPosts,
        (raw) => buildPostCandidate(raw, viewerUid),
        postSchema,
      );
      return { items, nextCursor };
    });
  }

  async getUserPosts(userId: UserId, params: FeedParams): Promise<Paginated<Post>> {
    return withReadableErrors('user posts', async () => {
      const { docs, nextCursor } = await queryCreatedAtPage(
        postsCollection(),
        [where('authorId', '==', userId)],
        params.cursor,
        params.limit,
      );
      const viewerUid = getCurrentUid();
      const built = await buildValidatedList(
        docs,
        (raw) => buildPostCandidate(raw, viewerUid),
        postSchema,
      );
      const items = built.filter((p) => p.archivedAt === undefined);
      return { items, nextCursor };
    });
  }

  /** A profile grid page: the user's own posts plus collabs they accepted. */
  private async profileGridPage(userId: UserId, params: FeedParams): Promise<Paginated<Post>> {
    return withReadableErrors('user posts', async () => {
      const [{ docs, nextCursor }, collabDocs] = await Promise.all([
        queryCreatedAtPage(postsCollection(), [where('authorId', '==', userId)], params.cursor, params.limit),
        // Accepted collabs also belong on the collaborator's grid. Two
        // equality filters — no composite index needed.
        queryAllWhere(postsCollection(), [
          where('collab.uid', '==', userId),
          where('collab.status', '==', 'accepted'),
        ]).catch((e: unknown) => {
          console.warn('[posts] collab posts unavailable', e);
          return [] as RawDoc[];
        }),
      ]);
      const viewerUid = getCurrentUid();
      const [built, collabBuilt] = await Promise.all([
        buildValidatedList(docs, (raw) => buildPostCandidate(raw, viewerUid), postSchema),
        buildValidatedList(collabDocs, (raw) => buildPostCandidate(raw, viewerUid), postSchema),
      ]);
      const own = built.filter((p) => p.archivedAt === undefined);
      const collabs = collabBuilt.filter((p) => p.archivedAt === undefined);
      const upper = params.cursor ? (decodeCursor(params.cursor)?.orderValue ?? null) : null;
      const lower = nextCursor ? (docs[docs.length - 1]?.data as { createdAt?: string } | undefined)?.createdAt ?? null : null;
      return { items: mergeCollabPosts(own, collabs, upper, lower), nextCursor };
    });
  }

  async pinComment(postId: PostId, commentId: CommentId): Promise<void> {
    const uid = requireCurrentUid();
    // Only the post author may pin.
    const postSnap = await postDocRef(postId).get();
    if (!postSnap.exists()) throw new Error(`Post ${postId} not found`);
    if ((postSnap.data() as Partial<PostDocFields>).authorId !== uid) {
      throw new Error('Only the post author can pin comments.');
    }
    // Enforce a single pinned comment: clear any existing pins first.
    const pinnedSnap = await commentsCollection(postId).where('isPinned', '==', true).get();
    await Promise.all(
      pinnedSnap.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
        d.ref.update({ isPinned: false }),
      ),
    );
    await commentDocRef(postId, commentId).update({ isPinned: true });
  }

  async unpinComment(postId: PostId, commentId: CommentId): Promise<void> {
    const uid = requireCurrentUid();
    const postSnap = await postDocRef(postId).get();
    if (!postSnap.exists()) throw new Error(`Post ${postId} not found`);
    if ((postSnap.data() as Partial<PostDocFields>).authorId !== uid) {
      throw new Error('Only the post author can unpin comments.');
    }
    await commentDocRef(postId, commentId).update({ isPinned: false });
  }

  async archivePost(id: PostId): Promise<void> {
    await this.setArchived(id, new Date().toISOString());
  }

  async unarchivePost(id: PostId): Promise<void> {
    await this.setArchived(id, null);
  }

  private async setArchived(id: PostId, archivedAt: string | null): Promise<void> {
    const uid = requireCurrentUid();
    const ref = postDocRef(id);
    const snap = await ref.get();
    if (!snap.exists()) throw new Error(`Post ${id} not found`);
    if ((snap.data() as Partial<PostDocFields>).authorId !== uid) {
      throw new Error('You can only archive your own posts.');
    }
    await ref.update({
      archivedAt: archivedAt ?? firestore.FieldValue.delete(),
    });
  }

  async getArchivedPosts(params: FeedParams): Promise<Paginated<Post>> {
    return withReadableErrors('archived posts', async () => {
      const uid = requireCurrentUid();
      const { docs, nextCursor } = await queryCreatedAtPage(
        postsCollection(),
        [where('authorId', '==', uid)],
        params.cursor,
        params.limit,
      );
      const built = await buildValidatedList(
        docs,
        (raw) => buildPostCandidate(raw, uid),
        postSchema,
      );
      const items = built.filter((p) => p.archivedAt !== undefined);
      return { items, nextCursor };
    });
  }
}
