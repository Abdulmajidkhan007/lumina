import type { Reel } from '@/types/models';
import type { ReelId } from '@/types/models';
import type { Paginated, ReelsParams } from '@/types/api';

// ---------------------------------------------------------------------------
// IReelsApi — the swap boundary for short-form video reels
// ---------------------------------------------------------------------------

export interface IReelsApi {
  getReels(params: ReelsParams): Promise<Paginated<Reel>>;
  likeReel(id: ReelId): Promise<void>;
  unlikeReel(id: ReelId): Promise<void>;
  saveReel(id: ReelId): Promise<void>;
  unsaveReel(id: ReelId): Promise<void>;
}
