/**
 * Firebase-backed IStoriesApi.
 *
 * Firestore schema:
 *  - `stories/{storyId}` — authorId, author (UserSummary embed), media,
 *    createdAt (ISO string), expiresAt (ISO string, typically createdAt + 24h),
 *    seenByUids?: string[] — legacy; rules only let the author update the story
 *    doc, so viewers' arrayUnion writes were always denied. Still read for
 *    old data.
 *  - `stories/{storyId}/views/{viewerUid}` — { uid, viewer (UserSummary),
 *    viewedAt }. Written by the viewer (never the author — your own view is
 *    not counted), readable only by the story's author ("Seen by" list).
 *  - `users/{uid}/seenStories/{storyId}` — { storyId, seenAt }. The viewer's
 *    private seen-marker that drives the tray's unseen ring. One range query
 *    on `seenAt` (last 24 h covers every still-active story) per tray load.
 *
 * `getStoryReels()` fetches all non-expired stories in one query and groups
 * them by author client-side into the `StoryReel` shape the contract expects
 * (there's no dedicated "story reels" collection to query directly).
 *
 * `createStory()` uploads any local-URI media to Cloud Storage
 * (`stories/{uid}/{timestamp}`) via `uploadMedia`, then writes a new
 * `stories/{storyId}` doc with `expiresAt` set to 24h from now. Because
 * `getStoryReels()` re-queries `expiresAt > now` on every call, the freshly
 * created story is picked up (and grouped into the author's own reel) as
 * soon as the `storyReels` query is invalidated/refetched.
 *
 * `reactToStory()` writes `stories/{storyId}/reactions/{uid}` — one reaction
 * per viewer per story (a repeat tap just overwrites the emoji + timestamp).
 * The `Notification` schema has no reaction-like variant yet, so this
 * intentionally does not fan out a notification to the author — wiring that
 * up is a schema change for a separate change.
 */
import type { IStoriesApi, CreateStoryInput, CreateHighlightInput } from '@/data/api/contracts';
import type { Story, StoryReel, StoryView, Highlight, StoryId, UserId } from '@/types/models';
import type { UserSummary, Media } from '@/schemas';
import { highlightSchema, storyReelSchema, storySchema, storyViewSchema } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
import { logActivity } from '@/data/services/activityLog';
import { fetchUserSummary, getCurrentUid, requireCurrentUid } from './helpers';
import { uploadMedia } from './upload';

interface StoryDocFields {
  authorId: string;
  author: UserSummary;
  media: Media;
  createdAt: string;
  expiresAt: string;
  seenByUids?: string[];
  audience?: 'all' | 'closeFriends';
}

function storiesCollection() {
  return getFirebaseFirestore().collection('stories');
}

function seenStoriesCollection(uid: string) {
  return getFirebaseFirestore().collection('users').doc(uid).collection('seenStories');
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Story ids the viewer marked seen within the last 24 h (= every active story they saw). */
async function fetchSeenStoryIds(viewerUid: string): Promise<Set<string>> {
  try {
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const snap = await seenStoriesCollection(viewerUid).where('seenAt', '>', since).get();
    return new Set(snap.docs.map((d) => d.id));
  } catch (error) {
    // The ring falls back to "unseen" — never block the tray on this.
    console.warn('[stories] seen markers unavailable', error);
    return new Set();
  }
}

/** The viewer's own summary, cached per uid — written into every view doc. */
let viewerSummaryCache: { uid: string; summary: UserSummary } | null = null;

async function getViewerSummary(uid: string): Promise<UserSummary | null> {
  if (viewerSummaryCache?.uid === uid) return viewerSummaryCache.summary;
  const summary = await fetchUserSummary(uid);
  if (summary) viewerSummaryCache = { uid, summary };
  return summary;
}

function highlightsCollection() {
  return getFirebaseFirestore().collection('highlights');
}

interface HighlightDocFields {
  ownerId: string;
  title: string;
  coverUri: string;
  media: Media[];
  createdAt: string;
}

/** Whether `viewerUid` is in `authorUid`'s Close Friends list. */
async function isViewerCloseFriendOf(authorUid: string, viewerUid: string): Promise<boolean> {
  if (authorUid === viewerUid) return true;
  const snap = await getFirebaseFirestore()
    .collection('users')
    .doc(authorUid)
    .collection('closeFriends')
    .doc(viewerUid)
    .get();
  return snap.exists();
}

export class FirebaseStoriesApi implements IStoriesApi {
  async getStoryReels(): Promise<StoryReel[]> {
    const nowIso = new Date().toISOString();
    const snapshot = await storiesCollection()
      .where('expiresAt', '>', nowIso)
      .orderBy('expiresAt', 'asc')
      .get();
    const viewerUid = getCurrentUid();
    const seenIds = viewerUid ? await fetchSeenStoryIds(viewerUid) : new Set<string>();

    type Accumulator = { author: UserSummary; stories: unknown[] };
    const byAuthor = new Map<string, Accumulator>();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Partial<StoryDocFields>;
      if (!data.authorId || !data.author) continue;

      // Close Friends stories are only visible to the author's close friends.
      if (data.audience === 'closeFriends') {
        if (!viewerUid || !(await isViewerCloseFriendOf(data.authorId, viewerUid))) {
          continue;
        }
      }

      const seen = viewerUid
        ? data.authorId === viewerUid ||
          seenIds.has(docSnap.id) ||
          (data.seenByUids ?? []).includes(viewerUid)
        : false;
      const storyCandidate = {
        id: docSnap.id,
        author: data.author,
        media: data.media,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        seen,
        ...(data.audience ? { audience: data.audience } : {}),
      };

      const existing = byAuthor.get(data.authorId);
      if (existing) {
        existing.stories.push(storyCandidate);
      } else {
        byAuthor.set(data.authorId, { author: data.author, stories: [storyCandidate] });
      }
    }

    const reels: StoryReel[] = [];
    for (const { author, stories } of byAuthor.values()) {
      const sorted = [...stories].sort((a, b) => {
        const aCreated = (a as { createdAt?: string }).createdAt ?? '';
        const bCreated = (b as { createdAt?: string }).createdAt ?? '';
        return aCreated.localeCompare(bCreated);
      });
      const hasUnseen = sorted.some((s) => !(s as { seen: boolean }).seen);
      const isCloseFriends = sorted.some(
        (s) => (s as { audience?: string }).audience === 'closeFriends',
      );
      const result = storyReelSchema.safeParse({ author, stories: sorted, hasUnseen, isCloseFriends });
      if (result.success) {
        reels.push(result.data);
      }
    }
    return reels;
  }

  async markSeen(storyId: StoryId, authorId: UserId): Promise<void> {
    const uid = requireCurrentUid();
    const now = new Date().toISOString();
    const writes: Promise<void>[] = [
      seenStoriesCollection(uid).doc(storyId).set({ storyId, seenAt: now }),
    ];
    // Your own view never counts.
    if (authorId !== uid) {
      const viewer = await getViewerSummary(uid);
      if (viewer) {
        writes.push(
          storiesCollection()
            .doc(storyId)
            .collection('views')
            .doc(uid)
            .set({ uid, viewer, viewedAt: now }),
        );
      }
    }
    await Promise.all(writes);
  }

  async getStoryViewers(storyId: StoryId): Promise<StoryView[]> {
    const snap = await storiesCollection().doc(storyId).collection('views').get();
    const views: StoryView[] = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as { viewer?: unknown; viewedAt?: unknown };
      const parsed = storyViewSchema.safeParse({ viewer: data.viewer, viewedAt: data.viewedAt });
      if (parsed.success) views.push(parsed.data);
    }
    return views.sort((a, b) => b.viewedAt.localeCompare(a.viewedAt));
  }

  async createStory(input: CreateStoryInput): Promise<Story> {
    const uid = requireCurrentUid();
    const author = await fetchUserSummary(uid);
    if (!author) {
      throw new Error('Current user profile not found');
    }

    const now = Date.now();
    const uri = input.uri.startsWith('http')
      ? input.uri
      : await uploadMedia(input.uri, `stories/${uid}/${now}`);
    const media: Media =
      input.type === 'video'
        ? {
            type: 'video',
            uri,
            width: input.width ?? 1080,
            height: input.height ?? 1920,
            ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
          }
        : {
            type: 'image',
            uri,
            width: input.width ?? 1080,
            height: input.height ?? 1920,
          };

    const createdAt = new Date(now).toISOString();
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    const newRef = storiesCollection().doc();
    const audience = input.audience ?? 'all';
    const storyDoc: StoryDocFields = {
      authorId: uid,
      author,
      media,
      createdAt,
      expiresAt,
      seenByUids: [],
      audience,
    };
    await newRef.set(storyDoc);
    void logActivity('story_create', { storyId: newRef.id, audience });

    return storySchema.parse({
      id: newRef.id,
      author,
      media,
      createdAt,
      expiresAt,
      seen: false,
      audience,
    });
  }

  async reactToStory(storyId: StoryId, emoji: string): Promise<void> {
    const uid = requireCurrentUid();
    await storiesCollection().doc(storyId).collection('reactions').doc(uid).set({
      emoji,
      createdAt: new Date().toISOString(),
    });
  }

  async getHighlights(userId: UserId): Promise<Highlight[]> {
    // Index-free: filter by ownerId only, sort newest-first client-side.
    const snapshot = await highlightsCollection().where('ownerId', '==', userId).get();
    const highlights: Highlight[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Partial<HighlightDocFields>;
      const parsed = highlightSchema.safeParse({
        id: docSnap.id,
        title: data.title,
        coverUri: data.coverUri,
        media: data.media,
        createdAt: data.createdAt,
      });
      if (parsed.success) highlights.push(parsed.data);
    }
    return highlights.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createHighlight(input: CreateHighlightInput): Promise<Highlight> {
    const uid = requireCurrentUid();
    const now = Date.now();
    const media: Media[] = await Promise.all(
      input.media.map(async (item, i): Promise<Media> => {
        const uri = item.uri.startsWith('http')
          ? item.uri
          : await uploadMedia(item.uri, `highlights/${uid}/${now}_${i}`);
        return item.type === 'video'
          ? {
              type: 'video',
              uri,
              width: item.width ?? 1080,
              height: item.height ?? 1920,
              ...(item.durationMs !== undefined ? { durationMs: item.durationMs } : {}),
            }
          : { type: 'image', uri, width: item.width ?? 1080, height: item.height ?? 1920 };
      }),
    );
    const coverUri = input.coverUri && input.coverUri.startsWith('http') ? input.coverUri : media[0]!.uri;
    const createdAt = new Date(now).toISOString();
    const newRef = highlightsCollection().doc();
    const doc: HighlightDocFields = {
      ownerId: uid,
      title: input.title.trim().slice(0, 20),
      coverUri,
      media,
      createdAt,
    };
    await newRef.set(doc);
    return highlightSchema.parse({ id: newRef.id, title: doc.title, coverUri, media, createdAt });
  }

  async deleteHighlight(id: string): Promise<void> {
    const uid = requireCurrentUid();
    const ref = highlightsCollection().doc(id);
    const snap = await ref.get();
    if (!snap.exists()) return;
    if ((snap.data() as Partial<HighlightDocFields>).ownerId !== uid) {
      throw new Error('You can only delete your own highlights.');
    }
    await ref.delete();
  }
}
