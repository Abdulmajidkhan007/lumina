import {
  canBlockUser,
  canEditRole,
  canTransitionReport,
  isBroadcastUnread,
  lastUtcDays,
  legacyReportStatus,
  mergeNewestFirst,
  nextReportStatuses,
  niceCeil,
  summarize,
  utcDayKey,
} from '../admin';
import { broadcastFormSchema } from '@/schemas/broadcast.schema';

describe('UTC day buckets', () => {
  it('lists consecutive UTC days ending today, oldest first', () => {
    const days = lastUtcDays(3, new Date('2026-10-11T21:30:00+05:00'));
    expect(days.map((d) => d.key)).toEqual(['2026-10-09', '2026-10-10', '2026-10-11']);
    expect(days[2]).toMatchObject({ startIso: '2026-10-11T00:00:00.000Z', endIso: '2026-10-12T00:00:00.000Z' });
  });

  it('keys by UTC across month ends', () => {
    expect(utcDayKey(new Date('2026-11-01T02:00:00+05:00'))).toBe('2026-10-31');
  });

  it('summarizes and scales', () => {
    expect(summarize([1, 2, 3])).toEqual({ total: 6, average: 2 });
    expect(summarize([])).toEqual({ total: 0, average: 0 });
    expect([0, 3, 12, 51].map(niceCeil)).toEqual([1, 5, 20, 100]);
  });
});

describe('report transitions', () => {
  it('matches the rules', () => {
    expect(nextReportStatuses('open')).toEqual(['reviewing', 'resolved', 'dismissed']);
    expect(nextReportStatuses('dismissed')).toEqual(['reviewing']);
    expect(canTransitionReport('resolved', 'dismissed')).toBe(false);
    expect(canTransitionReport('reviewing', 'open')).toBe(true);
    expect(legacyReportStatus('actioned')).toBe('resolved');
    expect(legacyReportStatus(null)).toBe('open');
  });
});

describe('role and block permissions', () => {
  it('only admins edit roles, never their own or the owner', () => {
    expect(canEditRole({ actor: 'admin', isSelf: false, isOwner: false })).toBe(true);
    expect(canEditRole({ actor: 'admin', isSelf: true, isOwner: false })).toBe(false);
    expect(canEditRole({ actor: 'admin', isSelf: false, isOwner: true })).toBe(false);
    expect(canEditRole({ actor: 'moderator', isSelf: false, isOwner: false })).toBe(false);
  });

  it('moderators block only ordinary users', () => {
    expect(canBlockUser({ actor: 'moderator', target: 'user', isSelf: false, isOwner: false })).toBe(true);
    expect(canBlockUser({ actor: 'moderator', target: 'admin', isSelf: false, isOwner: false })).toBe(false);
    expect(canBlockUser({ actor: 'admin', target: 'moderator', isSelf: false, isOwner: false })).toBe(true);
    expect(canBlockUser({ actor: 'admin', target: 'user', isSelf: true, isOwner: false })).toBe(false);
    expect(canBlockUser({ actor: 'user', target: 'user', isSelf: false, isOwner: false })).toBe(false);
  });
});

describe('announcements', () => {
  it('tracks unread against the watermark', () => {
    expect(isBroadcastUnread(10, null)).toBe(true);
    expect(isBroadcastUnread(10, 10)).toBe(false);
  });

  it('merges newest first', () => {
    const merged = mergeNewestFirst(
      [{ id: 'a', createdAt: '2026-10-11T00:00:00Z' }],
      [{ id: 'b', createdAt: '2026-10-12T00:00:00Z' }],
    );
    expect(merged.map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('validates the compose form like the rules', () => {
    expect(broadcastFormSchema.safeParse({ title: 'Hi', body: 'There', link: '' }).success).toBe(true);
    expect(broadcastFormSchema.safeParse({ title: ' ', body: 'x', link: '' }).success).toBe(false);
    const bad = broadcastFormSchema.safeParse({ title: 'Hi', body: 'x', link: 'javascript:alert(1)' });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues[0]?.message).toBe('linkInvalid');
  });
});
