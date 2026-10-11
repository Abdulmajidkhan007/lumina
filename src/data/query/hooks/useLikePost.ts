import type { PostId } from '@/types/models';
import { postsApi } from '@/data/api/client';
import { useOptimisticLike } from '../cache/useOptimisticLike';

type LikeVariables = { postId: PostId; liked: boolean };

/**
 * Likes/unlikes a post. Every cached copy — feed, profile grid, post detail
 * and its Reels twin — updates at once and rolls back together on failure.
 */
export function useLikePost() {
  return useOptimisticLike<LikeVariables>(
    ({ postId, liked }) => (liked ? postsApi.likePost(postId) : postsApi.unlikePost(postId)),
    (vars) => vars.postId,
  );
}
