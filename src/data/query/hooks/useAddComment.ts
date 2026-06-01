import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Comment, Post } from '@/types/models';
import type { Paginated } from '@/types/api';
import type { AddCommentInput } from '@/data/api/contracts';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

type AddCommentSnapshot = {
  postCache: Post | undefined;
};

export function useAddComment() {
  const qc = useQueryClient();

  return useMutation<Comment, Error, AddCommentInput, AddCommentSnapshot>({
    mutationFn: (input) => postsApi.addComment(input),

    onMutate: async ({ postId }: AddCommentInput) => {
      await qc.cancelQueries({ queryKey: queryKeys.post(postId) });
      await qc.cancelQueries({ queryKey: queryKeys.comments(postId) });

      const postCache = qc.getQueryData<Post>(queryKeys.post(postId));

      // Optimistically bump comment count on the post
      if (postCache) {
        qc.setQueryData<Post>(queryKeys.post(postId), {
          ...postCache,
          commentCount: postCache.commentCount + 1,
        });
      }

      return { postCache };
    },

    onError: (_err, { postId }, snapshot) => {
      if (snapshot?.postCache !== undefined) {
        qc.setQueryData<Post>(queryKeys.post(postId), snapshot.postCache);
      }
    },

    onSuccess: (newComment, { postId }) => {
      // Prepend the new comment to the first page of the comments infinite query
      const commentsKey = queryKeys.comments(postId);
      const existing =
        qc.getQueryData<InfiniteData<Paginated<Comment>>>(commentsKey);

      if (existing) {
        const [firstPage, ...rest] = existing.pages;
        if (firstPage) {
          qc.setQueryData<InfiniteData<Paginated<Comment>>>(commentsKey, {
            ...existing,
            pages: [
              { ...firstPage, items: [newComment, ...firstPage.items] },
              ...rest,
            ],
          });
        }
      }
    },

    onSettled: (_data, _err, { postId }: AddCommentInput) => {
      void qc.invalidateQueries({ queryKey: queryKeys.post(postId) });
      void qc.invalidateQueries({ queryKey: queryKeys.comments(postId) });
    },
  });
}
