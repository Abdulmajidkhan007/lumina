import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostId } from '@/types/models';
import { postsApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { queryKeys } from '../keys';

/**
 * Permanently deletes one of the current user's own posts. Drops the
 * single-post cache entry immediately (it's gone, no point refetching it)
 * and invalidates the feed, the author's profile grid/stats, and the
 * saved-posts list, since the deleted post could appear in any of them.
 */
export function useDeletePost() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation<void, Error, PostId>({
    mutationFn: (id) => postsApi.deletePost(id),

    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.post(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.feed() });
      void qc.invalidateQueries({ queryKey: queryKeys.savedPosts() });
      if (currentUser) {
        void qc.invalidateQueries({ queryKey: queryKeys.feedUser(currentUser.id) });
        void qc.invalidateQueries({ queryKey: queryKeys.user(currentUser.id) });
      }
    },
  });
}
