import { describe, expect, it } from 'vitest';
import { canTransition, isReportStatus, legacyStatus, nextStatuses } from '../admin/reportStatus';

describe('report status transitions (mirror firestore.rules)', () => {
  it('open and reviewing can move to any other status', () => {
    expect(nextStatuses('open')).toEqual(['reviewing', 'resolved', 'dismissed']);
    expect(nextStatuses('reviewing')).toEqual(['open', 'resolved', 'dismissed']);
  });

  it('closed reports can only be reopened to reviewing', () => {
    expect(nextStatuses('resolved')).toEqual(['reviewing']);
    expect(canTransition('dismissed', 'resolved')).toBe(false);
    expect(canTransition('dismissed', 'reviewing')).toBe(true);
  });

  it('a no-op move is not a transition', () => {
    expect(canTransition('open', 'open')).toBe(false);
  });

  it('maps legacy outcomes', () => {
    expect(legacyStatus('actioned')).toBe('resolved');
    expect(legacyStatus('dismissed')).toBe('dismissed');
    expect(legacyStatus(null)).toBe('open');
  });

  it('guards unknown values', () => {
    expect(isReportStatus('reviewing')).toBe(true);
    expect(isReportStatus('closed')).toBe(false);
    expect(isReportStatus(undefined)).toBe(false);
  });
});
