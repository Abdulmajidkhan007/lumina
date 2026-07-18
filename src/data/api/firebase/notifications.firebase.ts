/**
 * Firebase-backed INotificationsApi.
 *
 * Firestore schema:
 *  - `users/{uid}/notifications/{id}` — type ('like'|'comment'|'follow'|'mention'),
 *    actor (UserSummary embed), postPreview? ({ postId, thumbnailUri }),
 *    commentText? (comment), mentionContext? (mention), createdAt, read.
 */
import type { INotificationsApi } from '@/data/api/contracts';
import type { Notification } from '@/types/models';
import type { Paginated, CursorParams } from '@/types/api';
import { notificationSchema } from '@/schemas';
import { getFirebaseFirestore } from '@/lib/firebase';
import { buildValidatedList, queryCreatedAtPage, requireCurrentUid, type RawDoc } from './helpers';

const MARK_READ_BATCH_LIMIT = 450; // stays under Firestore's 500-op batch cap

function notificationsCollection(uid: string) {
  return getFirebaseFirestore().collection('users').doc(uid).collection('notifications');
}

export class FirebaseNotificationsApi implements INotificationsApi {
  async getNotifications(params?: CursorParams): Promise<Paginated<Notification>> {
    const uid = requireCurrentUid();
    const { docs, nextCursor } = await queryCreatedAtPage(
      notificationsCollection(uid),
      [],
      params?.cursor,
      params?.limit,
    );
    const items = await buildValidatedList(
      docs,
      (raw: RawDoc) => ({ id: raw.id, ...raw.data }),
      notificationSchema,
    );
    return { items, nextCursor };
  }

  async markAllRead(): Promise<void> {
    const uid = requireCurrentUid();
    const db = getFirebaseFirestore();
    // Loop in batches until no unread docs remain (bounded per iteration).
    for (;;) {
      const snapshot = await notificationsCollection(uid)
        .where('read', '==', false)
        .limit(MARK_READ_BATCH_LIMIT)
        .get();
      if (snapshot.empty) return;
      const batch = db.batch();
      for (const docSnap of snapshot.docs) {
        batch.update(docSnap.ref, { read: true });
      }
      await batch.commit();
      if (snapshot.size < MARK_READ_BATCH_LIMIT) return;
    }
  }
}
