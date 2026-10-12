import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { Notification, PostId, UserId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { notificationsApi, postsApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { queryKeys } from '../keys';

type RespondVariables = { notificationId: string; postId: PostId; accept: boolean };
type Snapshot = { pages: InfiniteData<Paginated<Notification>> | undefined };

/**
 * Accept / Decline a collab invite. The notification flips optimistically
 * (rolled back on failure); on success the post, the feed and the current
 * user's grid refresh so "A and B" appears only after accepting.
 */
export function useRespondToCollab() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation<void, Error, RespondVariables, Snapshot>({
    mutationFn: async ({ notificationId, postId, accept }) => {
      await postsApi.respondToCollab(postId, accept);
      await notificationsApi.setCollabResponse(notificationId, accept ? 'accepted' : 'declined');
    },
    onMutate: async ({ notificationId, accept }) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications() });
      const pages = qc.getQueryData<InfiniteData<Paginated<Notification>>>(queryKeys.notifications());
      if (pages) {
        qc.setQueryData<InfiniteData<Paginated<Notification>>>(queryKeys.notifications(), {
          ...pages,
          pages: pages.pages.map((page) => ({
            ...page,
            items: page.items.map((n) =>
              n.id === notificationId && n.type === 'collab_invite'
                ? { ...n, read: true, response: accept ? 'accepted' : 'declined' }
                : n,
            ),
          })),
        });
      }
      return { pages };
    },
    onError: (_err, _vars, snapshot) => {
      if (snapshot?.pages) qc.setQueryData(queryKeys.notifications(), snapshot.pages);
    },
    onSuccess: (_data, { postId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.post(postId) });
      void qc.invalidateQueries({ queryKey: queryKeys.feed() });
      if (currentUser) {
        void qc.invalidateQueries({ queryKey: queryKeys.feedUser(currentUser.id as UserId) });
      }
    },
  });
}
