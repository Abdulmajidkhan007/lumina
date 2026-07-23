/**
 * `posts` collection — feed reads + like toggling.
 *
 * Firestore schema mirrors the mobile app (see
 * `src/data/api/firebase/posts.firebase.ts` in the root project):
 * `posts/{id}` — authorId, author (denormalized UserSummary embed), media,
 * caption, likeCount, commentCount, createdAt (ISO string).
 * `posts/{id}/likes/{uid}` — membership marker; existence = liked, with
 * `likeCount` on the parent kept in sync via a transaction.
 */
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { uploadMedia } from './storage';
import type { Comment, MediaItem, Post, UserSummary } from '../types/models';

export const FEED_PAGE_SIZE = 20;

interface PostDocFields {
  authorId: string;
  author: UserSummary;
  media: MediaItem[];
  caption: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  location?: string;
  taggedUsers?: UserSummary[];
  archivedAt?: string;
  hashtags?: string[];
}

function postsCollection() {
  return collection(db, 'posts');
}

function postDocRef(id: string) {
  return doc(db, 'posts', id);
}

async function membershipFlag(postId: string, sub: 'likes' | 'saves'): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snap = await getDoc(doc(postDocRef(postId), sub, uid));
  return snap.exists();
}

function toPost(
  snap: QueryDocumentSnapshot<DocumentData>,
  isLikedByMe: boolean,
  isSavedByMe: boolean,
): Post | null {
  const data = snap.data() as Partial<PostDocFields>;
  if (!data.author || !Array.isArray(data.media) || data.media.length === 0 || !data.createdAt) {
    return null;
  }
  return {
    id: snap.id,
    authorId: data.authorId ?? data.author.id,
    author: data.author,
    media: data.media,
    caption: data.caption ?? null,
    likeCount: data.likeCount ?? 0,
    commentCount: data.commentCount ?? 0,
    isLikedByMe,
    isSavedByMe,
    ...(data.location ? { location: data.location } : {}),
    ...(data.taggedUsers ? { taggedUsers: data.taggedUsers } : {}),
    createdAt: data.createdAt,
  };
}

export interface FeedPage {
  posts: Post[];
  /** Pass to the next `fetchFeedPage` call to resume; null once exhausted. */
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function fetchFeedPage(
  cursor: QueryDocumentSnapshot<DocumentData> | null,
): Promise<FeedPage> {
  const q = cursor
    ? query(postsCollection(), orderBy('createdAt', 'desc'), startAfter(cursor), limit(FEED_PAGE_SIZE))
    : query(postsCollection(), orderBy('createdAt', 'desc'), limit(FEED_PAGE_SIZE));

  const snap = await getDocs(q);
  const [likedFlags, savedFlags] = await Promise.all([
    Promise.all(snap.docs.map((d) => membershipFlag(d.id, 'likes'))),
    Promise.all(snap.docs.map((d) => membershipFlag(d.id, 'saves'))),
  ]);
  const posts = snap.docs
    .map((d, i) => toPost(d, likedFlags[i] ?? false, savedFlags[i] ?? false))
    .filter((post): post is Post => post !== null)
    // Archived posts stay hidden from the feed (filtered client-side).
    .filter((post) => (snap.docs.find((d) => d.id === post.id)?.data() as Partial<PostDocFields>)?.archivedAt === undefined);
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    posts,
    cursor: lastDoc ?? null,
    hasMore: snap.docs.length === FEED_PAGE_SIZE,
  };
}

/** Toggles the like marker for the current user and keeps `likeCount` in sync. */
export async function setPostLiked(postId: string, liked: boolean): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to like posts.');
  }
  const parentRef = postDocRef(postId);
  const memberRef = doc(parentRef, 'likes', uid);

  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    if (!parentSnap.exists()) return;
    const memberSnap = await tx.get(memberRef);
    const exists = memberSnap.exists();

    if (liked && !exists) {
      tx.set(memberRef, { uid, createdAt: new Date().toISOString() });
      tx.update(parentRef, { likeCount: increment(1) });
    } else if (!liked && exists) {
      tx.delete(memberRef);
      tx.update(parentRef, { likeCount: increment(-1) });
    }
  });
}

/** Toggles the save marker + mirrors into users/{uid}/saves for the saved grid. */
export async function setPostSaved(postId: string, saved: boolean): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to save posts.');
  const memberRef = doc(postDocRef(postId), 'saves', uid);
  const mirrorRef = doc(db, 'users', uid, 'saves', postId);
  if (saved) {
    await setDoc(memberRef, { uid, createdAt: new Date().toISOString() });
    await setDoc(mirrorRef, { postId, createdAt: new Date().toISOString() });
  } else {
    await runTransaction(db, async (tx) => {
      tx.delete(memberRef);
      tx.delete(mirrorRef);
    });
  }
}

export async function fetchPost(id: string): Promise<Post | null> {
  const snap = await getDoc(postDocRef(id));
  if (!snap.exists()) return null;
  const [liked, saved] = await Promise.all([membershipFlag(id, 'likes'), membershipFlag(id, 'saves')]);
  return toPost(snap as QueryDocumentSnapshot<DocumentData>, liked, saved);
}

/** A user's own posts (index-free — filter by authorId, sort client-side). */
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const snap = await getDocs(query(postsCollection(), where('authorId', '==', userId), limit(60)));
  const docs = snap.docs.sort((a, b) =>
    String((b.data() as Partial<PostDocFields>).createdAt ?? '').localeCompare(
      String((a.data() as Partial<PostDocFields>).createdAt ?? ''),
    ),
  );
  return docs
    .map((d) => toPost(d, false, false))
    .filter((p): p is Post => p !== null)
    .filter((p) => (docs.find((d) => d.id === p.id)?.data() as Partial<PostDocFields>)?.archivedAt === undefined);
}

interface CommentDocFields {
  postId: string;
  authorId: string;
  author: UserSummary;
  text: string;
  likeCount: number;
  createdAt: string;
  parentId: string | null;
}

/** Top-level comments for a post (index-free). */
export async function fetchComments(postId: string): Promise<Comment[]> {
  const snap = await getDocs(
    query(collection(postDocRef(postId), 'comments'), where('parentId', '==', null), limit(100)),
  );
  return snap.docs
    .map((d) => {
      const data = d.data() as Partial<CommentDocFields>;
      if (!data.author || typeof data.text !== 'string' || typeof data.createdAt !== 'string') return null;
      return {
        id: d.id,
        postId,
        author: data.author,
        text: data.text,
        likeCount: data.likeCount ?? 0,
        createdAt: data.createdAt,
      } satisfies Comment;
    })
    .filter((c): c is Comment => c !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addComment(postId: string, text: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to comment.');
  const authorSnap = await getDoc(doc(db, 'users', uid));
  const a = authorSnap.data() as Record<string, unknown> | undefined;
  const author: UserSummary = {
    id: uid,
    username: (a?.username as string) ?? 'you',
    displayName: (a?.displayName as string) ?? 'You',
    avatarUrl: (a?.avatarUrl as string | null) ?? null,
    isVerified: (a?.isVerified as boolean) ?? false,
  };
  await addDoc(collection(postDocRef(postId), 'comments'), {
    postId,
    authorId: uid,
    author,
    text,
    likeCount: 0,
    createdAt: new Date().toISOString(),
    replyCount: 0,
    parentId: null,
  });
  await runTransaction(db, async (tx) => {
    const p = await tx.get(postDocRef(postId));
    if (p.exists()) tx.update(postDocRef(postId), { commentCount: increment(1) });
  });
}

const HASHTAG_RE = /#([\p{L}0-9_]+)/gu;
function extractHashtags(caption: string): string[] {
  const out = new Set<string>();
  for (const m of caption.matchAll(HASHTAG_RE)) out.add(m[1].toLowerCase());
  return [...out];
}

export interface CreatePostParams {
  files: Blob[];
  caption: string;
  location?: string;
}

/** Uploads media to Storage and writes the post doc (mirrors mobile createPost). */
export async function createPost({ files, caption, location }: CreatePostParams): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to post.');
  const authorSnap = await getDoc(doc(db, 'users', uid));
  const a = authorSnap.data() as Record<string, unknown> | undefined;
  const author: UserSummary = {
    id: uid,
    username: (a?.username as string) ?? 'you',
    displayName: (a?.displayName as string) ?? 'You',
    avatarUrl: (a?.avatarUrl as string | null) ?? null,
    isVerified: (a?.isVerified as boolean) ?? false,
  };
  const media: MediaItem[] = await Promise.all(
    files.map(async (file) => {
      const uri = await uploadMedia(file, 'posts');
      return { type: 'image', uri, width: 1080, height: 1080 } satisfies MediaItem;
    }),
  );
  const createdAt = new Date().toISOString();
  const ref = await addDoc(postsCollection(), {
    authorId: uid,
    author,
    media,
    caption: caption.length > 0 ? caption : null,
    hashtags: extractHashtags(caption),
    likeCount: 0,
    commentCount: 0,
    createdAt,
    ...(location ? { location } : {}),
  });
  await runTransaction(db, async (tx) => {
    const u = await tx.get(doc(db, 'users', uid));
    if (u.exists()) tx.update(doc(db, 'users', uid), { postCount: increment(1) });
  });
  return ref.id;
}
