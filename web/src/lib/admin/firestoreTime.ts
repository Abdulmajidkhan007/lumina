import { Timestamp } from 'firebase/firestore';

/**
 * Newer admin collections store server Timestamps; older ones ISO strings.
 * Normalizes either to ISO 8601, or null when absent/pending.
 */
export function timestampToIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string' && value.length > 0) return value;
  return null;
}
