import { formatDistanceToNow } from 'date-fns';

// ---------------------------------------------------------------------------
// formatCount — compact number notation (1.2k, 3.4M)
// ---------------------------------------------------------------------------

export function formatCount(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1_000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  const m = n / 1_000_000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}

// ---------------------------------------------------------------------------
// formatRelativeTime — "2 hours ago", "just now", etc.
// ---------------------------------------------------------------------------

export function formatRelativeTime(isoDate: string): string {
  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// formatDuration — milliseconds → "m:ss" or "h:mm:ss"
// ---------------------------------------------------------------------------

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  // For short clips, omit leading zero on minutes: "0:30" → "0:30", "1:05"
  return `${minutes}:${ss}`;
}
