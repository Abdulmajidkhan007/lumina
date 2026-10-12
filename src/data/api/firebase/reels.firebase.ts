/**
 * Firebase-backed IReelsApi.
 *
 * Firestore schema:
 *  - `reels/{reelId}` — authorId, author (UserSummary embed), video
 *    (VideoMedia), caption, likeCount, commentCount, shareCount, audioTitle?,
 *    createdAt (ISO string).
 *    - `reels/{reelId}/likes/{uid}` — membership marker; existence = liked.
 *      `likeCount` kept in sync via FieldValue.increment.
 *    - `reels/{reelId}/saves/{uid}` — membership marker; existence = saved.
 *
 * Mirrors posts.firebase.ts's pagination + like/save patterns. Reels are not
 * created through IReelsApi (no `createReel` method on the contract) — a
 * single-video post writes its twin at `reels/{postId}`. For such a twin the
 * like state and counts are read from the POST (`posts/{id}` + its likes),
 * and the client likes the post, so Reels / feed / post detail always agree.
 * Pre-twin reels (no matching post) keep their own likes subcollection.
 */
import type { IReelsApi } from '@/data/api/contracts';
import type { Reel, ReelId } from '@/types/models';
import type { Paginated, ReelsParams } from '@/types/api';
import { reelSchema } from '@/schemas';
import type { UserSummary, VideoMedia } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
import {
  buildValidatedList,
  getCurrentUid,
  getMembershipFlags,
  queryCreatedAtPage,
  requireCurrentUid,
  setMembershipFlag,
  where,
  type RawDoc,
} from './helpers';

interface ReelDocFields {
  authorId: string;
  author: UserSummary;
  video: VideoMedia;
  caption: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  audioTitle?: string;
  createdAt: string;
}

function reelsCollection() {
  return getFirebaseFirestore().collection('reels');
}

function reelDocRef(id: string) {
  return getFirebaseFirestore().collection('reels').doc(id);
}

interface PostCounters {
  likeCount?: number;
  commentCount?: number;
}

async function buildReelCandidate(raw: RawDoc, viewerUid: string | null): Promise<unknown> {
  const data = raw.data as Partial<ReelDocFields>;
  const postRef = getFirebaseFirestore().collection('posts').doc(raw.id);
  const postSnap = await postRef.get();
  const twin = postSnap.exists() ? (postSnap.data() as PostCounters) : null;
  const [[isLikedByMe], [isSavedByMe]] = await Promise.all([
    getMembershipFlags(twin ? postRef : reelDocRef(raw.id), ['likes'], viewerUid),
    getMembershipFlags(reelDocRef(raw.id), ['saves'], viewerUid),
  ]);
  return {
    id: raw.id,
    ...(twin ? { postId: raw.id } : {}),
    author: data.author,
    video: data.video,
    caption: data.caption ?? null,
    likeCount: (twin ? twin.likeCount : data.likeCount) ?? 0,
    commentCount: (twin ? twin.commentCount : data.commentCount) ?? 0,
    shareCount: data.shareCount ?? 0,
    isLikedByMe,
    isSavedByMe,
    ...(data.audioTitle ? { audioTitle: data.audioTitle } : {}),
    createdAt: data.createdAt,
  };
}

export class FirebaseReelsApi implements IReelsApi {
  async getReels(params: ReelsParams): Promise<Paginated<Reel>> {
    const constraints = params.userId ? [where('authorId', '==', params.userId)] : [];
    const { docs, nextCursor } = await queryCreatedAtPage(
      reelsCollection(),
      constraints,
      params.cursor,
      params.limit,
    );
    const viewerUid = getCurrentUid();
    const items = await buildValidatedList(
      docs,
      (raw) => buildReelCandidate(raw, viewerUid),
      reelSchema,
    );
    return { items, nextCursor };
  }

  async likeReel(id: ReelId): Promise<void> {
    await setMembershipFlag({
      parentRef: reelDocRef(id),
      subcollection: 'likes',
      uid: requireCurrentUid(),
      shouldExist: true,
      counterField: 'likeCount',
    });
  }

  async unlikeReel(id: ReelId): Promise<void> {
    await setMembershipFlag({
      parentRef: reelDocRef(id),
      subcollection: 'likes',
      uid: requireCurrentUid(),
      shouldExist: false,
      counterField: 'likeCount',
    });
  }

  async saveReel(id: ReelId): Promise<void> {
    await setMembershipFlag({
      parentRef: reelDocRef(id),
      subcollection: 'saves',
      uid: requireCurrentUid(),
      shouldExist: true,
    });
  }

  async unsaveReel(id: ReelId): Promise<void> {
    await setMembershipFlag({
      parentRef: reelDocRef(id),
      subcollection: 'saves',
      uid: requireCurrentUid(),
      shouldExist: false,
    });
  }
}
