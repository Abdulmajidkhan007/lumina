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
 */
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import type { IStoriesApi } from '@/data/api/contracts';
import type { StoryReel, StoryId } from '@/types/models';
import type { UserSummary, Media } from '@/schemas';
import { storyReelSchema } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
import { getCurrentUid, requireCurrentUid } from './helpers';

interface StoryDocFields {
  authorId: string;
  author: UserSummary;
  media: Media;
  createdAt: string;
  expiresAt: string;
  seenByUids?: string[];
}

function storiesCollection() {
  return collection(getFirebaseFirestore(), 'stories');
}

export class FirebaseStoriesApi implements IStoriesApi {
  async getStoryReels(): Promise<StoryReel[]> {
    const nowIso = new Date().toISOString();
    const snapshot = await getDocs(
      query(storiesCollection(), where('expiresAt', '>', nowIso), orderBy('expiresAt', 'asc')),
    );
    const viewerUid = getCurrentUid();

    type Accumulator = { author: UserSummary; stories: unknown[] };
    const byAuthor = new Map<string, Accumulator>();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Partial<StoryDocFields>;
      if (!data.authorId || !data.author) continue;

      const seen = viewerUid ? (data.seenByUids ?? []).includes(viewerUid) : false;
      const storyCandidate = {
        id: docSnap.id,
        author: data.author,
        media: data.media,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        seen,
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
      const result = storyReelSchema.safeParse({ author, stories: sorted, hasUnseen });
      if (result.success) {
        reels.push(result.data);
      }
    }
    return reels;
  }

  async markSeen(storyId: StoryId): Promise<void> {
    const uid = requireCurrentUid();
    await updateDoc(doc(getFirebaseFirestore(), 'stories', storyId), {
      seenByUids: arrayUnion(uid),
    });
  }
}
