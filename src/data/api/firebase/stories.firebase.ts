/**
 * Firebase-backed IStoriesApi.
 *
 * Firestore schema:
 *  - `stories/{storyId}` — authorId, author (UserSummary embed), media,
 *    createdAt (ISO string), expiresAt (ISO string, typically createdAt + 24h),
 *    seenByUids: string[] — viewer uids that have seen this story, updated via
 *    FieldValue.arrayUnion on `markSeen`. Storing the seen-list as an array on
 *    the story doc (rather than a `seenBy/{uid}` subcollection) avoids an
 *    extra per-story read for every viewer on every tray render — stories are
 *    short-lived and the array stays small.
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
import firestore from '@react-native-firebase/firestore';
import type { IStoriesApi, CreateStoryInput, CreateHighlightInput } from '@/data/api/contracts';
import type { Story, StoryReel, Highlight, StoryId, UserId } from '@/types/models';
import type { UserSummary, Media } from '@/schemas';
import { highlightSchema, storyReelSchema, storySchema } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
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

      const seen = viewerUid ? (data.seenByUids ?? []).includes(viewerUid) : false;
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

  async markSeen(storyId: StoryId): Promise<void> {
    const uid = requireCurrentUid();
    await storiesCollection().doc(storyId).update({
      seenByUids: firestore.FieldValue.arrayUnion(uid),
    });
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
    const snapshot = await highlightsCollection()
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
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
    return highlights;
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
