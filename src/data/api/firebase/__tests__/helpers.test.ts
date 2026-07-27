import { encodeCursor, decodeCursor } from '../helpers';

describe('cursor encoding', () => {
  it('round-trips an order value and document id', () => {
    const cursor = encodeCursor('2026-07-21T08:00:00.000Z', 'post-123');
    expect(decodeCursor(cursor)).toEqual({
      orderValue: '2026-07-21T08:00:00.000Z',
      id: 'post-123',
    });
  });

  it('round-trips values containing separators', () => {
    const cursor = encodeCursor('a_b|c', 'id_with_underscores');
    expect(decodeCursor(cursor)).toEqual({ orderValue: 'a_b|c', id: 'id_with_underscores' });
  });

  it('returns null for a malformed cursor instead of throwing', () => {
    expect(decodeCursor('not-base64!!')).toBeNull();
  });

  it('returns null when the payload is missing fields', () => {
    const partial = btoa(JSON.stringify({ v: 'only-order-value' }));
    expect(decodeCursor(partial)).toBeNull();
  });
});
