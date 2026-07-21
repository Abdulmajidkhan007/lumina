import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostId } from '@/types/models';
import { postsApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { queryKeys } from '../keys';

/**
 * Archives or restores one of the current user's posts. Archived posts drop
 * out of the feed/grid but remain in the owner's Archive; restoring puts them
 * back. Invalidates every list a post can appear in.
 */
export function useArchivePost() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation<void, Error, { id: PostId; archive: boolean }>({
    mutationFn: ({ id, archive }) =>
      archive ? postsApi.archivePost(id) : postsApi.unarchivePost(id),

    onSuccess: (_data, { id }) => {
      qc.removeQueries({ queryKey: queryKeys.post(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.feed() });
      void qc.invalidateQueries({ queryKey: queryKeys.archivedPosts() });
      if (currentUser) {
        void qc.invalidateQueries({ queryKey: queryKeys.feedUser(currentUser.id) });
        void qc.invalidateQueries({ queryKey: queryKeys.user(currentUser.id) });
      }
    },
  });
}
