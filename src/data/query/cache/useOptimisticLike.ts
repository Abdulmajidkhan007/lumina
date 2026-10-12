import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { isLikeBearingQuery, patchLikeInCacheData } from './likeCache';
import type { PostId } from '@/types/models';

type LikeSnapshot = Array<[QueryKey, unknown]>;

/**
 * Optimistic like shared by posts and reels: patches every cached copy of the
 * target (see likeCache.ts), rolls all of them back if the write fails, and
 * re-reads only the post detail afterwards (lists keep the patched state —
 * refetching whole feeds on every tap would flicker and cost reads).
 */
export function useOptimisticLike<TVars extends { liked: boolean }>(
  mutationFn: (vars: TVars) => Promise<void>,
  targetIdOf: (vars: TVars) => string,
) {
  const qc = useQueryClient();
  const filters = { predicate: (q: { queryKey: QueryKey }) => isLikeBearingQuery(q.queryKey) };

  return useMutation<void, Error, TVars, LikeSnapshot>({
    mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries(filters);
      const snapshot = qc.getQueriesData<unknown>(filters);
      const targetId = targetIdOf(vars);
      for (const [key, data] of snapshot) {
        const next = patchLikeInCacheData(data, targetId, vars.liked);
        if (next !== data) qc.setQueryData(key, next);
      }
      return snapshot;
    },
    onError: (_err, _vars, snapshot) => {
      for (const [key, data] of snapshot ?? []) qc.setQueryData(key, data);
    },
    onSettled: (_data, _err, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.post(targetIdOf(vars) as PostId) });
    },
  });
}
