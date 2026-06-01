import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { Comment } from '@/types/models';
import type { PostId, CommentId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function useComments(
  postId: PostId,
  parentCommentId?: CommentId,
): UseInfiniteQueryResult<InfiniteData<Paginated<Comment>>, Error> {
  return useInfiniteQuery({
    queryKey: queryKeys.comments(postId, parentCommentId),
    queryFn: ({ pageParam }) =>
      postsApi.getComments({
        postId,
        parentCommentId,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(postId),
  });
}
