const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

/**
 * Formats an ISO 8601 timestamp as a short relative label ("5m", "3h", "2d").
 * Falls back to a locale date once it's more than a week old, and to
 * "just now" for anything in the last minute or in the future (clock drift).
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < MINUTE) {
    return 'just now';
  }
  if (diffSeconds < HOUR) {
    return `${Math.floor(diffSeconds / MINUTE)}m`;
  }
  if (diffSeconds < DAY) {
    return `${Math.floor(diffSeconds / HOUR)}h`;
  }
  if (diffSeconds < WEEK) {
    return `${Math.floor(diffSeconds / DAY)}d`;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Formats an ISO 8601 timestamp as an absolute, locale-aware date. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
