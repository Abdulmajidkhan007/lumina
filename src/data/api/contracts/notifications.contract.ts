import type { Notification } from '@/types/models';
import type { Paginated, CursorParams } from '@/types/api';

// ---------------------------------------------------------------------------
// INotificationsApi — the swap boundary for activity notifications
// ---------------------------------------------------------------------------

export interface INotificationsApi {
  getNotifications(params?: CursorParams): Promise<Paginated<Notification>>;
  markAllRead(): Promise<void>;
  /** Records the answer on a collab-invite notification (and marks it read). */
  setCollabResponse(notificationId: string, response: 'accepted' | 'declined'): Promise<void>;
}
