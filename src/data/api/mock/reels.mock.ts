import type { IReelsApi } from '@/data/api/contracts';
import type { Reel , ReelId } from '@/types/models';
import type { Paginated, ReelsParams } from '@/types/api';
import { mutableReels } from './fixtures/reels.fixture';
import { mockDelay } from './latency';
import { paginateArray } from './pagination';

export class MockReelsApi implements IReelsApi {
  async getReels(params: ReelsParams): Promise<Paginated<Reel>> {
    await mockDelay();
    const filtered = params.userId
      ? mutableReels.filter((r) => r.author.id === params.userId)
      : mutableReels;
    return paginateArray(filtered, params.cursor, params.limit);
  }

  async likeReel(id: ReelId): Promise<void> {
    await mockDelay();
    const reel = mutableReels.find((r) => r.id === id);
    if (reel && !reel.isLikedByMe) {
      reel.isLikedByMe = true;
      reel.likeCount += 1;
    }
  }

  async unlikeReel(id: ReelId): Promise<void> {
    await mockDelay();
    const reel = mutableReels.find((r) => r.id === id);
    if (reel && reel.isLikedByMe) {
      reel.isLikedByMe = false;
      reel.likeCount = Math.max(0, reel.likeCount - 1);
    }
  }

  async saveReel(id: ReelId): Promise<void> {
    await mockDelay();
    const reel = mutableReels.find((r) => r.id === id);
    if (reel) reel.isSavedByMe = true;
  }

  async unsaveReel(id: ReelId): Promise<void> {
    await mockDelay();
    const reel = mutableReels.find((r) => r.id === id);
    if (reel) reel.isSavedByMe = false;
  }
}
