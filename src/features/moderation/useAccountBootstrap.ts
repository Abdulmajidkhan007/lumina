/**
 * Once per signed-in session: record daily presence (DAU, lastActiveAt,
 * admin-search email) and join the announcements push topic. Both are
 * best-effort and never block the UI.
 */
import { useEffect, useState } from 'react';
import { recordDailyPresence } from '@/data/services/presence';
import { subscribeOwnBan } from '@/data/services/accountStatus';
import { subscribeToBroadcasts } from '@/services/push';

export function useAccountBootstrap(): void {
  useEffect(() => {
    void recordDailyPresence().catch(() => undefined);
    void subscribeToBroadcasts();
  }, []);
}

/** Live "is my account blocked by a moderator?". */
export function useIsBlocked(): boolean {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => subscribeOwnBan(setBlocked), []);
  return blocked;
}
