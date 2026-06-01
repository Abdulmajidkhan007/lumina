import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Post , PostId } from '@/types/models';
import { postsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

export function usePost(id: PostId): UseQueryResult<Post, Error> {
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => postsApi.getPost(id),
    enabled: Boolean(id),
  });
}
