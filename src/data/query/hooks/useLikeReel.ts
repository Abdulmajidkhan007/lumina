import type { PostId, ReelId } from '@/types/models';
import { postsApi, reelsApi } from '@/data/api/client';
import { useOptimisticLike } from '../cache/useOptimisticLike';

type LikeReelVariables = {
  reelId: ReelId;
  /** Set when the reel mirrors a feed post — the like is stored on the post. */
  postId?: PostId;
  liked: boolean;
};

/**
 * Likes/unlikes a reel. A reel twin of a post likes the post itself, so the
 * feed and post detail show the same heart and count (shared cache patch).
 */
export function useLikeReel() {
  return useOptimisticLike<LikeReelVariables>(
    ({ reelId, postId, liked }) => {
      if (postId) return liked ? postsApi.likePost(postId) : postsApi.unlikePost(postId);
      return liked ? reelsApi.likeReel(reelId) : reelsApi.unlikeReel(reelId);
    },
    (vars) => vars.postId ?? vars.reelId,
  );
}
