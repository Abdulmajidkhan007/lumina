import { describe, expect, it } from 'vitest';
import { lastUtcDays, summarize, utcDayKey } from '../admin/dayBuckets';
import { niceCeil } from '../admin/chartScale';

describe('lastUtcDays', () => {
  const now = new Date('2026-10-11T21:30:00+05:00'); // 16:30 UTC

  it('returns `days` consecutive UTC days ending today, oldest first', () => {
    const days = lastUtcDays(3, now);
    expect(days.map((d) => d.key)).toEqual(['2026-10-09', '2026-10-10', '2026-10-11']);
  });

  it('uses half-open [start, end) day ranges', () => {
    const [day] = lastUtcDays(1, now);
    expect(day).toEqual({
      key: '2026-10-11',
      startIso: '2026-10-11T00:00:00.000Z',
      endIso: '2026-10-12T00:00:00.000Z',
    });
  });

  it('crosses month boundaries', () => {
    expect(lastUtcDays(2, new Date('2026-11-01T01:00:00Z')).map((d) => d.key)).toEqual(['2026-10-31', '2026-11-01']);
  });

  it('keys by UTC, not local time', () => {
    expect(utcDayKey(new Date('2026-10-12T02:00:00+05:00'))).toBe('2026-10-11');
  });
});

describe('summarize', () => {
  it('sums and averages', () => {
    expect(summarize([2, 4, 6])).toEqual({ total: 12, average: 4 });
    expect(summarize([])).toEqual({ total: 0, average: 0 });
  });
});

describe('niceCeil', () => {
  it('rounds up to 1/2/5 × 10ⁿ', () => {
    expect([0, 1, 3, 7, 12, 48, 51, 999].map(niceCeil)).toEqual([1, 1, 5, 10, 20, 50, 100, 1000]);
  });
});
