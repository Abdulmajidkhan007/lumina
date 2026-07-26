/**
 * Reels, Stories, Notifications and Saved posts (web) — mirrors the mobile
 * Firestore schema (`src/data/api/firebase/*.firebase.ts` in the root
 * project). Reads are index-free (equality filters + client-side sort) so no
 * composite indexes are required.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { MediaItem, Post, UserSummary, VideoMedia } from '../types/models';

// ---------------------------------------------------------------------------
// Reels
// ---------------------------------------------------------------------------

export interface Reel {
  id: string;
  author: UserSummary;
  video: VideoMedia;
  caption: string | null;
  likeCount: number;
  commentCount: number;
  audioTitle?: string;
  createdAt: string;
}

export async function fetchReels(): Promise<Reel[]> {
  const snap = await getDocs(query(collection(db, 'reels'), orderBy('createdAt', 'desc'), limit(30)));
  return snap.docs
    .map((d): Reel | null => {
      const data = d.data() as Record<string, unknown>;
      const video = data.video as VideoMedia | undefined;
      const author = data.author as UserSummary | undefined;
      if (!video || !author || typeof data.createdAt !== 'string') return null;
      return {
        id: d.id,
        author,
        video,
        caption: (data.caption as string | null) ?? null,
        likeCount: (data.likeCount as number) ?? 0,
        commentCount: (data.commentCount as number) ?? 0,
        audioTitle: data.audioTitle as string | undefined,
        createdAt: data.createdAt,
      };
    })
    .filter((r): r is Reel => r !== null);
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export interface Story {
  id: string;
  author: UserSummary;
  media: MediaItem;
  createdAt: string;
  expiresAt: string;
}

export interface StoryReel {
  author: UserSummary;
  stories: Story[];
}

/** Active (non-expired) stories grouped by author. Close-Friends items are skipped. */
export async function fetchStoryReels(): Promise<StoryReel[]> {
  const nowIso = new Date().toISOString();
  const snap = await getDocs(
    query(collection(db, 'stories'), where('expiresAt', '>', nowIso), limit(100)),
  );
  const byAuthor = new Map<string, StoryReel>();
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const author = data.author as UserSummary | undefined;
    const media = data.media as MediaItem | undefined;
    if (!author || !media || typeof data.createdAt !== 'string') continue;
    // Close-Friends stories need a membership check the web app doesn't do yet.
    if (data.audience === 'closeFriends') continue;
    const story: Story = {
      id: d.id,
      author,
      media,
      createdAt: data.createdAt,
      expiresAt: (data.expiresAt as string) ?? '',
    };
    const existing = byAuthor.get(author.id);
    if (existing) existing.stories.push(story);
    else byAuthor.set(author.id, { author, stories: [story] });
  }
  for (const reel of byAuthor.values()) {
    reel.stories.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return [...byAuthor.values()];
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  actor: UserSummary;
  postPreview?: { postId: string; thumbnailUri: string };
  commentText?: string;
  createdAt: string;
  read: boolean;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50)),
  );
  return snap.docs
    .map((d): AppNotification | null => {
      const data = d.data() as Record<string, unknown>;
      const actor = data.actor as UserSummary | undefined;
      const type = data.type as AppNotification['type'] | undefined;
      if (!actor || !type || typeof data.createdAt !== 'string') return null;
      return {
        id: d.id,
        type,
        actor,
        postPreview: data.postPreview as AppNotification['postPreview'],
        commentText: data.commentText as string | undefined,
        createdAt: data.createdAt,
        read: (data.read as boolean) ?? false,
      };
    })
    .filter((n): n is AppNotification => n !== null);
}

export async function markAllNotificationsRead(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'notifications'), where('read', '==', false), limit(400)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  for (const d of snap.docs) batch.update(d.ref, { read: true });
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Saved posts
// ---------------------------------------------------------------------------

/** Resolves users/{uid}/saves markers to their posts, most recently saved first. */
export async function fetchSavedPosts(): Promise<Post[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const markers = await getDocs(query(collection(db, 'users', uid, 'saves'), limit(60)));
  const ordered = markers.docs.sort((a, b) =>
    String((b.data() as Record<string, unknown>).createdAt ?? '').localeCompare(
      String((a.data() as Record<string, unknown>).createdAt ?? ''),
    ),
  );
  const posts = await Promise.all(ordered.map((m) => getDoc(doc(db, 'posts', m.id))));
  return posts
    .filter((p) => p.exists())
    .map((p): Post | null => {
      const data = p.data() as Record<string, unknown>;
      const author = data.author as UserSummary | undefined;
      const media = data.media as MediaItem[] | undefined;
      if (!author || !media || media.length === 0 || typeof data.createdAt !== 'string') return null;
      return {
        id: p.id,
        authorId: (data.authorId as string) ?? author.id,
        author,
        media,
        caption: (data.caption as string | null) ?? null,
        likeCount: (data.likeCount as number) ?? 0,
        commentCount: (data.commentCount as number) ?? 0,
        isLikedByMe: false,
        isSavedByMe: true,
        createdAt: data.createdAt,
      };
    })
    .filter((p): p is Post => p !== null);
}
