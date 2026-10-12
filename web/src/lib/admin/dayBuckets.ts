/**
 * UTC day buckets for the admin Overview charts. Daily-active docs are keyed
 * by UTC day (firestore.rules → todayUtc()), so new users / posts are
 * bucketed by the same UTC boundaries to keep the three series comparable.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DayBucket {
  /** "YYYY-MM-DD" (UTC). */
  key: string;
  /** Inclusive start, ISO 8601. */
  startIso: string;
  /** Exclusive end, ISO 8601. */
  endIso: string;
}

/** "YYYY-MM-DD" of `date` in UTC. */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The last `days` UTC days ending with today, oldest first. */
export function lastUtcDays(days: number, now: Date = new Date()): DayBucket[] {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, i) => {
    const start = todayStart - (days - 1 - i) * DAY_MS;
    return {
      key: utcDayKey(new Date(start)),
      startIso: new Date(start).toISOString(),
      endIso: new Date(start + DAY_MS).toISOString(),
    };
  });
}

/** Sum and average of a series; average is 0 for an empty series. */
export function summarize(values: readonly number[]): { total: number; average: number } {
  const total = values.reduce((sum, v) => sum + v, 0);
  return { total, average: values.length === 0 ? 0 : total / values.length };
}
