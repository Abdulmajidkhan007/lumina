import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { Reel , ReelId } from '@/types/models';
import type { Paginated } from '@/types/api';
import { reelsApi } from '@/data/api/client';
import { queryKeys } from '../keys';

type SaveReelVariables = { reelId: ReelId; saved: boolean };

type SaveReelSnapshot = {
  reelPages: InfiniteData<Paginated<Reel>> | undefined;
};

function patchReelInFeed(
  data: InfiniteData<Paginated<Reel>>,
  reelId: ReelId,
  patch: Partial<Reel>,
): InfiniteData<Paginated<Reel>> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((r) =>
        r.id === reelId ? { ...r, ...patch } : r,
      ),
    })),
  };
}

export function useSaveReel() {
  const qc = useQueryClient();

  return useMutation<void, Error, SaveReelVariables, SaveReelSnapshot>({
    mutationFn: ({ reelId, saved }) =>
      saved ? reelsApi.saveReel(reelId) : reelsApi.unsaveReel(reelId),

    onMutate: async ({ reelId, saved }) => {
      await qc.cancelQueries({ queryKey: queryKeys.reels() });

      const reelPages =
        qc.getQueryData<InfiniteData<Paginated<Reel>>>(queryKeys.reels());

      if (reelPages) {
        qc.setQueryData<InfiniteData<Paginated<Reel>>>(
          queryKeys.reels(),
          patchReelInFeed(reelPages, reelId, { isSavedByMe: saved }),
        );
      }

      return { reelPages };
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot?.reelPages !== undefined) {
        qc.setQueryData<InfiniteData<Paginated<Reel>>>(
          queryKeys.reels(),
          snapshot.reelPages,
        );
      }
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reels() });
    },
  });
}
