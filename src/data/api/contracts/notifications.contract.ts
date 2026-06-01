import type { Notification } from '@/types/models';
import type { Paginated, CursorParams } from '@/types/api';

// ---------------------------------------------------------------------------
// INotificationsApi — the swap boundary for activity notifications
// ---------------------------------------------------------------------------

export interface INotificationsApi {
  getNotifications(params?: CursorParams): Promise<Paginated<Notification>>;
  markAllRead(): Promise<void>;
}
