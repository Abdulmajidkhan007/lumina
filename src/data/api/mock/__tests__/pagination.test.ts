import { paginateArray, encodeCursor, decodeCursor } from '@/data/api/mock/pagination';

const items = Array.from({ length: 25 }, (_, i) => i);

describe('paginateArray', () => {
  it('returns the first page with the requested limit and a non-null cursor', () => {
    const page1 = paginateArray(items, undefined, 10);
    expect(page1.items).toEqual(items.slice(0, 10));
    expect(page1.nextCursor).not.toBeNull();
  });

  it('chains through pages via nextCursor until it is null', () => {
    const page1 = paginateArray(items, undefined, 10);
    const page2 = paginateArray(items, page1.nextCursor ?? undefined, 10);
    const page3 = paginateArray(items, page2.nextCursor ?? undefined, 10);

    expect(page2.items).toEqual(items.slice(10, 20));
    expect(page2.nextCursor).not.toBeNull();

    expect(page3.items).toEqual(items.slice(20, 25));
    expect(page3.items).toHaveLength(5);
    expect(page3.nextCursor).toBeNull();
  });

  it('returns an empty page with a null cursor once past the end', () => {
    const lastCursor = encodeCursor(25);
    const page = paginateArray(items, lastCursor, 10);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it('uses the default limit when none is provided', () => {
    const page = paginateArray(items, undefined);
    expect(page.items).toHaveLength(12);
  });
});

describe('encodeCursor / decodeCursor', () => {
  it('round-trips an index through the cursor encoding', () => {
    expect(decodeCursor(encodeCursor(7))).toBe(7);
  });

  it('decodeCursor falls back to 0 for a malformed cursor', () => {
    expect(decodeCursor('not-base64-!!')).toBe(0);
  });
});
