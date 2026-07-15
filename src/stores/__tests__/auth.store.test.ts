import { useAuthStore } from '@/stores/auth.store';
import { userIdSchema } from '@/schemas';
import type { User } from '@/types/models';
import type { AuthSession } from '@/stores/auth.store';

const fakeUser: User = {
  id: userIdSchema.parse('user-1'),
  username: 'jane',
  displayName: 'Jane Doe',
  avatarUrl: null,
  bio: null,
  isVerified: false,
  isPrivate: false,
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  isFollowedByMe: false,
  isMe: true,
  createdAt: new Date().toISOString(),
};

const fakeSession: AuthSession = { token: 'test-token', user: fakeUser };

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, status: 'idle' });
  });

  it('setSession sets status to authenticated and stores the session', () => {
    useAuthStore.getState().setSession(fakeSession);

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.session).toEqual(fakeSession);
  });

  it('clearSession resets status to unauthenticated and nulls the session', () => {
    useAuthStore.getState().setSession(fakeSession);
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.session).toBeNull();
  });
});
