/** Admin side of announcements: publish, list, delete. */
import type { BroadcastFormValues, Broadcast } from '@/schemas/broadcast.schema';
import { toBroadcast } from '@/data/services/broadcastService';
import { adminLogData, currentStaff, db, newAdminLogRef, serverTimestamp } from './common';

export async function publishBroadcast(values: BroadcastFormValues): Promise<void> {
  const me = currentStaff();
  const ref = db().collection('broadcasts').doc();
  const batch = db().batch();
  batch.set(ref, {
    title: values.title,
    body: values.body,
    ...(values.link ? { link: values.link } : {}),
    createdBy: me.uid,
    ...(me.email ? { createdByEmail: me.email } : {}),
    createdAt: serverTimestamp(),
  });
  batch.set(
    newAdminLogRef(),
    adminLogData({ action: 'broadcast_send', targetType: 'broadcast', targetId: ref.id, note: values.title }),
  );
  await batch.commit();
}

export async function fetchRecentBroadcasts(max = 30): Promise<Broadcast[]> {
  const snap = await db().collection('broadcasts').orderBy('createdAt', 'desc').limit(max).get();
  return snap.docs.flatMap((d) => {
    const b = toBroadcast(d.id, d.data());
    return b ? [b] : [];
  });
}

export async function deleteBroadcast(id: string): Promise<void> {
  const batch = db().batch();
  batch.delete(db().collection('broadcasts').doc(id));
  batch.set(newAdminLogRef(), adminLogData({ action: 'broadcast_delete', targetType: 'broadcast', targetId: id }));
  await batch.commit();
}
