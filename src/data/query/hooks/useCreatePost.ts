import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Post } from '@/types/models';
import type { CreatePostInput } from '@/data/api/contracts';
import { postsApi } from '@/data/api/client';
import { useCurrentUser } from '@/stores/auth.store';
import { queryKeys } from '../keys';

/**
 * Creates a post. No optimistic cache write — media upload can take a while
 * and we don't have a stable id/URLs until the server responds — so the feed
 * simply gets invalidated (and refetched) on success.
 */
export function useCreatePost() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation<Post, Error, CreatePostInput>({
    mutationFn: (input) => postsApi.createPost(input),

    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.feed() });
      if (currentUser) {
        void qc.invalidateQueries({ queryKey: queryKeys.feedUser(currentUser.id) });
        void qc.invalidateQueries({ queryKey: queryKeys.user(currentUser.id) });
      }
    },
  });
}
