import { describe, expect, it } from 'vitest';
import { BROADCAST_TITLE_MAX, isBroadcastUnread, mergeNewestFirst, validateBroadcast } from '../broadcastUtils';

describe('validateBroadcast', () => {
  const ok = { title: 'Update', body: 'Version 2 is out', link: '' };

  it('accepts a valid draft, with or without an http(s) link', () => {
    expect(validateBroadcast(ok)).toEqual({});
    expect(validateBroadcast({ ...ok, link: 'https://lumina-007app.web.app/app' })).toEqual({});
  });

  it('requires title and body (whitespace does not count)', () => {
    expect(validateBroadcast({ ...ok, title: '   ', body: '' })).toEqual({
      title: 'Title is required.',
      body: 'Message is required.',
    });
  });

  it('caps the title length', () => {
    expect(validateBroadcast({ ...ok, title: 'x'.repeat(BROADCAST_TITLE_MAX + 1) }).title).toBeDefined();
  });

  it('rejects non-http links (javascript:, mailto:, spaces)', () => {
    for (const link of ['javascript:alert(1)', 'mailto:a@b.c', 'https://a b.com', 'lumina.app']) {
      expect(validateBroadcast({ ...ok, link }).link).toBeDefined();
    }
  });
});

describe('isBroadcastUnread', () => {
  it('is unread when never read or newer than the watermark', () => {
    expect(isBroadcastUnread(1000, null)).toBe(true);
    expect(isBroadcastUnread(1000, 999)).toBe(true);
    expect(isBroadcastUnread(1000, 1000)).toBe(false);
  });
});

describe('mergeNewestFirst', () => {
  it('interleaves two lists by createdAt, newest first', () => {
    const a = [{ id: 'n2', createdAt: '2026-10-11T10:00:00Z' }, { id: 'n1', createdAt: '2026-10-09T10:00:00Z' }];
    const b = [{ id: 'b1', createdAt: '2026-10-10T10:00:00Z' }];
    expect(mergeNewestFirst(a, b).map((x) => x.id)).toEqual(['n2', 'b1', 'n1']);
  });
});
