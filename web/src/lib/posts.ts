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
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { MediaItem, Post, UserSummary } from '../types/models';

export const FEED_PAGE_SIZE = 20;

interface PostDocFields {
  authorId: string;
  author: UserSummary;
  media: MediaItem[];
  caption: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

function postsCollection() {
  return collection(db, 'posts');
}

function postDocRef(id: string) {
  return doc(db, 'posts', id);
}

async function isLikedByCurrentUser(postId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snap = await getDoc(doc(postDocRef(postId), 'likes', uid));
  return snap.exists();
}

function toPost(snap: QueryDocumentSnapshot<DocumentData>, isLikedByMe: boolean): Post | null {
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
  const likedFlags = await Promise.all(snap.docs.map((d) => isLikedByCurrentUser(d.id)));
  const posts = snap.docs
    .map((d, i) => toPost(d, likedFlags[i] ?? false))
    .filter((post): post is Post => post !== null);
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
