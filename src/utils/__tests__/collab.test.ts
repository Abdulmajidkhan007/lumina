import { canRespondToCollab, mergeCollabPosts, parseCollab, visibleCollaborators } from '../collab';

const user = { id: 'b', username: 'bob', displayName: 'Bob', avatarUrl: null, isVerified: false };
const collab = (status: string) => ({ collab: { uid: 'b', status, user } });

describe('visibleCollaborators', () => {
  it('shows the collaborator only after they accept', () => {
    expect(visibleCollaborators(collab('accepted'))).toEqual([user]);
    expect(visibleCollaborators(collab('pending'))).toBeUndefined();
    expect(visibleCollaborators(collab('declined'))).toBeUndefined();
  });

  it('treats legacy and malformed data as a plain post', () => {
    expect(visibleCollaborators({})).toBeUndefined();
    expect(visibleCollaborators({ collab: { uid: 'b', user } })).toBeUndefined(); // no status
    expect(visibleCollaborators({ collab: { uid: 'b', status: 'accepted', user: { ...user, id: 'x' } } })).toBeUndefined();
    expect(visibleCollaborators({ collab: 'accepted' })).toBeUndefined();
  });
});

describe('canRespondToCollab', () => {
  it('only the invited profile, only while pending', () => {
    expect(canRespondToCollab(collab('pending'), 'b')).toBe(true);
    expect(canRespondToCollab(collab('pending'), 'a')).toBe(false);
    expect(canRespondToCollab(collab('accepted'), 'b')).toBe(false);
    expect(parseCollab(null)).toBeNull();
  });
});

describe('mergeCollabPosts', () => {
  const p = (id: string, createdAt: string) => ({ id, createdAt });

  it('interleaves collabs inside the page window by date, without duplicates', () => {
    const own = [p('o1', '2026-10-10'), p('o2', '2026-10-05')];
    const collabs = [p('c1', '2026-10-08'), p('c2', '2026-10-01'), p('c3', '2026-10-12'), p('o1', '2026-10-10')];
    // First page (no upper bound), more pages follow (lower bound = last own item).
    expect(mergeCollabPosts(own, collabs, null, '2026-10-05').map((x) => x.id)).toEqual(['c3', 'o1', 'c1', 'o2']);
    // Last page: no lower bound, upper bound = previous cursor.
    expect(mergeCollabPosts([], collabs, '2026-10-05', null).map((x) => x.id)).toEqual(['c2']);
  });
});
