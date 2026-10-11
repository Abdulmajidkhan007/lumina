import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeOwnBan } from '../lib/admin/bans';
import { fetchBroadcastReadAt, fetchBroadcastsSince } from '../lib/broadcasts';
import { isBroadcastUnread } from '../lib/broadcastUtils';

export interface AccountNotices {
  /** The account is blocked by a moderator (writes are rejected). */
  banned: boolean;
  /** An announcement newer than the user's read watermark exists. */
  unreadBroadcast: boolean;
}

/** Account-level banners/badges for the app shell. */
export function useAccountNotices(): AccountNotices {
  const { firebaseUser, profile } = useAuth();
  const uid = firebaseUser?.uid ?? null;
  const joinedAt = profile?.createdAt ?? null;
  const [banned, setBanned] = useState(false);
  const [unreadBroadcast, setUnreadBroadcast] = useState(false);

  useEffect(() => {
    if (!uid) return undefined;
    return subscribeOwnBan(uid, setBanned);
  }, [uid]);

  useEffect(() => {
    if (!uid || !joinedAt) return undefined;
    let active = true;
    void Promise.all([fetchBroadcastsSince(joinedAt), fetchBroadcastReadAt()])
      .then(([items, readAt]) => {
        const newest = items[0];
        if (active) setUnreadBroadcast(!!newest && isBroadcastUnread(Date.parse(newest.createdAt), readAt));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [uid, joinedAt]);

  return { banned: uid ? banned : false, unreadBroadcast };
}
