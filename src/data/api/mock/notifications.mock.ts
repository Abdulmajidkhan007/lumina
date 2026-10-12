import type { INotificationsApi } from '@/data/api/contracts';
import type { Notification } from '@/types/models';
import type { Paginated, CursorParams } from '@/types/api';
import { mutableNotifications } from './fixtures/notifications.fixture';
import { mockDelay } from './latency';
import { paginateArray } from './pagination';

export class MockNotificationsApi implements INotificationsApi {
  async getNotifications(params?: CursorParams): Promise<Paginated<Notification>> {
    await mockDelay();
    return paginateArray(mutableNotifications, params?.cursor, params?.limit);
  }

  async setCollabResponse(notificationId: string, response: 'accepted' | 'declined'): Promise<void> {
    await mockDelay();
    const notif = mutableNotifications.find((n) => n.id === notificationId);
    if (notif?.type === 'collab_invite') {
      Object.assign(notif, { response, read: true });
    }
  }

  async markAllRead(): Promise<void> {
    await mockDelay();
    for (const notif of mutableNotifications) {
      (notif as { read: boolean }).read = true;
    }
  }
}
