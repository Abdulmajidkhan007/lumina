import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PostId, CommentId } from '@/types/models';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

/**
 * Pins or unpins a comment (post author only). Refreshes the top-level
 * comments page so the pinned comment re-sorts to the top.
 */
export function usePinComment() {
  const qc = useQueryClient();

  return useMutation<void, Error, { postId: PostId; commentId: CommentId; pin: boolean }>({
    mutationFn: ({ postId, commentId, pin }) =>
      pin ? postsApi.pinComment(postId, commentId) : postsApi.unpinComment(postId, commentId),

    onSettled: (_data, _err, { postId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.comments(postId) });
    },
  });
}
