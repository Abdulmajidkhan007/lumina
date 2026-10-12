import type { ReportStatus } from '@/utils/admin';
import type { PillTone } from './AdminPrimitives';

export const STATUS_TONE: Record<ReportStatus, PillTone> = {
  open: 'accent',
  reviewing: 'strong',
  resolved: 'success',
  dismissed: 'neutral',
};
