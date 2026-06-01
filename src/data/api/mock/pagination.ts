import type { Paginated } from '@/types/api';

const DEFAULT_LIMIT = 12;

/**
 * Applies cursor-based pagination to an in-memory array.
 * cursor encodes the starting index as a decimal string encoded in base64.
 * Uses btoa/atob which are available in both browser and React Native (Hermes).
 */
export function paginateArray<T>(
  items: T[],
  cursor: string | undefined,
  limit: number = DEFAULT_LIMIT,
): Paginated<T> {
  const startIndex = cursor !== undefined ? decodeCursor(cursor) : 0;
  const slice = items.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + slice.length;
  const nextCursor = nextIndex < items.length ? encodeCursor(nextIndex) : null;

  return { items: slice, nextCursor };
}

export function encodeCursor(index: number): string {
  return btoa(String(index));
}

export function decodeCursor(cursor: string): number {
  try {
    const n = parseInt(atob(cursor), 10);
    return isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}
