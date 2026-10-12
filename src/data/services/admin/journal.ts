/** Admin action journal (`adminLogs`) for the Activity tab. */
import { db, str, toIso } from './common';

export interface AdminLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string | null;
  note: string | null;
  createdAt: string;
}

export async function fetchAdminLogs(max = 100): Promise<AdminLogEntry[]> {
  const snap = await db().collection('adminLogs').orderBy('createdAt', 'desc').limit(max).get();
  return snap.docs.flatMap((d): AdminLogEntry[] => {
    const data = d.data();
    const action = str(data.action);
    const createdAt = toIso(data.createdAt);
    if (!action || !createdAt) return [];
    const targetType = str(data.targetType);
    const targetId = str(data.targetId);
    return [
      {
        id: d.id,
        action,
        actor: str(data.actorEmail) ?? str(data.actorId) ?? '',
        target: targetType && targetId ? `${targetType}: ${targetId}` : targetId,
        note: str(data.note),
        createdAt,
      },
    ];
  });
}
