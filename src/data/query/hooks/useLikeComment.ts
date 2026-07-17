import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Comment, PostId, CommentId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

type CommentsQueryKey = ReturnType<typeof queryKeys.comments>;

type LikeCommentVariables = {
  postId: PostId;
  commentId: CommentId;
  liked: boolean;
  /** Present when the comment being liked is a reply — scopes the cache patch to the right page */
  parentCommentId?: CommentId;
};

type LikeCommentSnapshot = {
  queryKey: CommentsQueryKey;
  pages: InfiniteData<Paginated<Comment>> | undefined;
};

/** Patches a Comment in-place within an infinite comments page array */
function patchCommentInPages(
  data: InfiniteData<Paginated<Comment>>,
  commentId: CommentId,
  patch: Partial<Comment>,
): InfiniteData<Paginated<Comment>> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((c) => (c.id === commentId ? { ...c, ...patch } : c)),
    })),
  };
}

export function useLikeComment() {
  const qc = useQueryClient();

  return useMutation<void, Error, LikeCommentVariables, LikeCommentSnapshot>({
    mutationFn: ({ postId, commentId, liked }) =>
      liked ? postsApi.likeComment(postId, commentId) : postsApi.unlikeComment(postId, commentId),

    onMutate: async ({ postId, commentId, liked, parentCommentId }) => {
      const queryKey = queryKeys.comments(postId, parentCommentId);
      await qc.cancelQueries({ queryKey });

      const pages = qc.getQueryData<InfiniteData<Paginated<Comment>>>(queryKey);
      const current = pages?.pages
        .flatMap((page) => page.items)
        .find((c) => c.id === commentId);

      const patch: Partial<Comment> = {
        isLikedByMe: liked,
        likeCount: Math.max(0, (current?.likeCount ?? 0) + (liked ? 1 : -1)),
      };

      if (pages) {
        qc.setQueryData<InfiniteData<Paginated<Comment>>>(
          queryKey,
          patchCommentInPages(pages, commentId, patch),
        );
      }

      return { queryKey, pages };
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot?.pages !== undefined) {
        qc.setQueryData<InfiniteData<Paginated<Comment>>>(snapshot.queryKey, snapshot.pages);
      }
    },

    onSettled: (_data, _err, { postId, parentCommentId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.comments(postId, parentCommentId) });
    },
  });
}
