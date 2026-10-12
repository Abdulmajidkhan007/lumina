/**
 * Admin announcements for the Notifications screen: the list (published
 * after the viewer signed up) plus the per-user read watermark, and a
 * mutation that moves the watermark to "now".
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/stores/auth.store';
import {
  fetchBroadcastReadAt,
  fetchBroadcastsSince,
  markBroadcastsRead,
} from '@/data/services/broadcastService';
import type { Broadcast } from '@/schemas/broadcast.schema';
import { isBroadcastUnread } from '@/utils/admin';

export const broadcastKeys = {
  feed: (uid: string) => ['broadcasts', uid] as const,
};

export interface BroadcastItem extends Broadcast {
  read: boolean;
}

export function useBroadcasts() {
  const user = useCurrentUser();
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: broadcastKeys.feed(uid),
    enabled: uid.length > 0,
    queryFn: async (): Promise<BroadcastItem[]> => {
      const [items, readAt] = await Promise.all([
        fetchBroadcastsSince(user?.createdAt ?? null),
        fetchBroadcastReadAt(),
      ]);
      return items.map((b) => ({ ...b, read: !isBroadcastUnread(Date.parse(b.createdAt), readAt) }));
    },
    staleTime: 60_000,
  });
}

export function useMarkBroadcastsRead() {
  const qc = useQueryClient();
  const uid = useCurrentUser()?.id ?? '';
  return useMutation({
    mutationFn: markBroadcastsRead,
    onMutate: () => {
      qc.setQueryData<BroadcastItem[]>(broadcastKeys.feed(uid), (items) =>
        items?.map((b) => ({ ...b, read: true })),
      );
    },
  });
}
