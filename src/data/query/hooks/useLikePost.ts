import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Post , PostId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

type LikeVariables = { postId: PostId; liked: boolean };

type PostSnapshot = {
  postCache: Post | undefined;
  feedPages: InfiniteData<Paginated<Post>> | undefined;
};

/** Patches a Post in-place within an infinite feed page array */
function patchPostInFeed(
  data: InfiniteData<Paginated<Post>>,
  postId: PostId,
  patch: Partial<Post>,
): InfiniteData<Paginated<Post>> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((p) =>
        p.id === postId ? { ...p, ...patch } : p,
      ),
    })),
  };
}

export function useLikePost() {
  const qc = useQueryClient();

  return useMutation<void, Error, LikeVariables, PostSnapshot>({
    mutationFn: ({ postId, liked }) =>
      liked ? postsApi.likePost(postId) : postsApi.unlikePost(postId),

    onMutate: async ({ postId, liked }) => {
      // Cancel in-flight queries that could overwrite our optimistic update
      await qc.cancelQueries({ queryKey: queryKeys.post(postId) });
      await qc.cancelQueries({ queryKey: queryKeys.feed() });

      const postCache = qc.getQueryData<Post>(queryKeys.post(postId));
      const feedPages = qc.getQueryData<InfiniteData<Paginated<Post>>>(
        queryKeys.feed(),
      );

      const patch: Partial<Post> = {
        isLikedByMe: liked,
        likeCount: (postCache?.likeCount ?? 0) + (liked ? 1 : -1),
      };

      // Update single post cache
      if (postCache) {
        qc.setQueryData<Post>(queryKeys.post(postId), { ...postCache, ...patch });
      }

      // Update feed infinite cache
      if (feedPages) {
        qc.setQueryData<InfiniteData<Paginated<Post>>>(
          queryKeys.feed(),
          patchPostInFeed(feedPages, postId, patch),
        );
      }

      return { postCache, feedPages };
    },

    onError: (_err, { postId }, snapshot) => {
      if (snapshot?.postCache !== undefined) {
        qc.setQueryData<Post>(queryKeys.post(postId), snapshot.postCache);
      }
      if (snapshot?.feedPages !== undefined) {
        qc.setQueryData<InfiniteData<Paginated<Post>>>(
          queryKeys.feed(),
          snapshot.feedPages,
        );
      }
    },

    onSettled: (_data, _err, { postId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.post(postId) });
      void qc.invalidateQueries({ queryKey: queryKeys.feed() });
    },
  });
}
