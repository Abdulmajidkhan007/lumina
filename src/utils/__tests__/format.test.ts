import { formatCount, formatDuration, formatRelativeTime } from '@/utils/format';

describe('formatCount', () => {
  it('returns the plain number below 1000', () => {
    expect(formatCount(999)).toBe('999');
  });

  it('formats thousands with one decimal when not a round number', () => {
    expect(formatCount(1200)).toBe('1.2k');
  });

  it('formats a round thousand without a decimal', () => {
    expect(formatCount(2000)).toBe('2k');
  });

  it('formats millions with one decimal when not a round number', () => {
    expect(formatCount(3400000)).toBe('3.4M');
  });

  it('formats a round million without a decimal', () => {
    expect(formatCount(5000000)).toBe('5M');
  });
});

describe('formatDuration', () => {
  it('formats sub-hour durations as m:ss', () => {
    expect(formatDuration(65000)).toBe('1:05');
  });

  it('formats durations under a minute with a leading 0', () => {
    expect(formatDuration(30000)).toBe('0:30');
  });

  it('formats durations over an hour as h:mm:ss', () => {
    expect(formatDuration(3665000)).toBe('1:01:05');
  });
});

describe('formatRelativeTime', () => {
  it('returns a non-empty string for a past ISO date', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(twoHoursAgo);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns an empty string for an unparseable date', () => {
    expect(formatRelativeTime('not-a-date')).toBe('');
  });
});
