/**
 * Firebase-backed IPostsApi.
 *
 * Firestore schema:
 *  - `posts/{postId}` — authorId, author (denormalized UserSummary embed),
 *    media, caption, likeCount, commentCount, createdAt (ISO string), location?.
 *    - `posts/{postId}/likes/{uid}` — membership marker; existence = liked.
 *      `likeCount` on the parent doc is kept in sync via FieldValue.increment.
 *    - `posts/{postId}/saves/{uid}` — membership marker; existence = saved.
 *      (No counter — Post has no public save count.)
 *    - `posts/{postId}/comments/{commentId}` — postId, authorId, author embed,
 *      text, likeCount, createdAt, replyCount, parentId (string | null; stored
 *      as null rather than omitted so top-level comments can be queried with
 *      `where('parentId', '==', null)`).
 *
 * `createPost` uploads any local-URI media to Cloud Storage
 * (`posts/{uid}/{timestamp}_{index}`) via `uploadMedia`, then writes the
 * post doc with the resulting download URLs and increments the author's
 * `postCount`.
 */
import {
  collection,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import type { IPostsApi, AddCommentInput, CreatePostInput } from '@/data/api/contracts';
import type { Post, Comment, PostId, UserId } from '@/types/models';
import type { Paginated, FeedParams, CommentParams } from '@/types/api';
import { postSchema, commentSchema } from '@/schemas';
import type { Media } from '@/schemas';
import type { UserSummary } from '@/types/models';
import { getFirebaseFirestore } from '@/lib/firebase';
import {
  buildValidatedList,
  fetchUserSummary,
  getMembershipFlags,
  queryCreatedAtPage,
  requireCurrentUid,
  getCurrentUid,
  setMembershipFlag,
  withReadableErrors,
  type RawDoc,
} from './helpers';
import { uploadMedia } from './upload';

interface PostDocFields {
  authorId: string;
  author: UserSummary;
  media: Media[];
  caption: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  location?: string;
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
}

function postsCollection() {
  return collection(getFirebaseFirestore(), 'posts');
}

function postDocRef(id: string) {
  return doc(getFirebaseFirestore(), 'posts', id);
}

function commentsCollection(postId: string) {
  return collection(postDocRef(postId), 'comments');
}

async function buildPostCandidate(raw: RawDoc, viewerUid: string | null): Promise<unknown> {
  const data = raw.data as Partial<PostDocFields>;
  const [isLikedByMe, isSavedByMe] = await getMembershipFlags(
    postDocRef(raw.id),
    ['likes', 'saves'],
    viewerUid,
  );
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
  };
}

function buildCommentCandidate(raw: RawDoc): unknown {
  const data = raw.data as Partial<CommentDocFields>;
  return {
    id: raw.id,
    postId: data.postId,
    author: data.author,
    text: data.text,
    likeCount: data.likeCount ?? 0,
    isLikedByMe: false, // IPostsApi exposes no comment-like mutation
    createdAt: data.createdAt,
    replyCount: data.replyCount ?? 0,
    ...(data.parentId ? { parentId: data.parentId } : {}),
  };
}

export class FirebasePostsApi implements IPostsApi {
  async getFeed(params: FeedParams): Promise<Paginated<Post>> {
    return withReadableErrors('feed', async () => {
      const constraints = params.userId ? [where('authorId', '==', params.userId)] : [];
      const { docs, nextCursor } = await queryCreatedAtPage(
        postsCollection(),
        constraints,
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
    const newRef = doc(postsCollection());
    const postDoc: PostDocFields = {
      authorId: uid,
      author,
      media,
      caption: input.caption.length > 0 ? input.caption : null,
      likeCount: 0,
      commentCount: 0,
      createdAt,
      ...(input.location ? { location: input.location } : {}),
    };
    await setDoc(newRef, postDoc);
    await updateDoc(doc(getFirebaseFirestore(), 'users', uid), { postCount: increment(1) });

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
    });
  }

  async getPost(id: PostId): Promise<Post> {
    const snap = await getDoc(postDocRef(id));
    if (!snap.exists()) {
      throw new Error(`Post ${id} not found`);
    }
    const candidate = await buildPostCandidate({ id: snap.id, data: snap.data() ?? {} }, getCurrentUid());
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
    await setMembershipFlag({
      parentRef: postDocRef(id),
      subcollection: 'saves',
      uid: requireCurrentUid(),
      shouldExist: saved,
    });
  }

  async getComments(params: CommentParams): Promise<Paginated<Comment>> {
    const constraints = [where('parentId', '==', params.parentCommentId ?? null)];
    const { docs, nextCursor } = await queryCreatedAtPage(
      commentsCollection(params.postId),
      constraints,
      params.cursor,
      params.limit,
    );
    const items = await buildValidatedList(docs, buildCommentCandidate, commentSchema);
    return { items, nextCursor };
  }

  async addComment(input: AddCommentInput): Promise<Comment> {
    const uid = requireCurrentUid();
    const author = await fetchUserSummary(uid);
    if (!author) {
      throw new Error('Current user profile not found');
    }
    const now = new Date().toISOString();
    const newRef = doc(commentsCollection(input.postId));
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
    await setDoc(newRef, commentDoc);
    await updateDoc(postDocRef(input.postId), { commentCount: increment(1) });

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

  async getUserPosts(userId: UserId, params: FeedParams): Promise<Paginated<Post>> {
    return withReadableErrors('user posts', async () => {
      const { docs, nextCursor } = await queryCreatedAtPage(
        postsCollection(),
        [where('authorId', '==', userId)],
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
}
