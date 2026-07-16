import type { IAuthApi, AuthSession } from '@/data/api/contracts';
import type { User } from '@/types/models';
import type { LoginInput, SignupInput, EditProfileInput } from '@/types/forms';
import { userIdSchema } from '@/schemas';
import { currentUser, mutableUsers } from './fixtures';
import { mockDelay } from './latency';

const MOCK_TOKEN = 'mock-jwt-token-lumina-dev';

export class MockAuthApi implements IAuthApi {
  async login(_input: LoginInput): Promise<AuthSession> {
    await mockDelay();
    return { token: MOCK_TOKEN, user: currentUser };
  }

  async signup(input: SignupInput): Promise<AuthSession> {
    await mockDelay();
    const newUser: User = {
      id: userIdSchema.parse(`user-${Date.now()}`),
      username: input.username,
      displayName: input.displayName,
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
    mutableUsers.unshift(newUser);
    return { token: MOCK_TOKEN, user: newUser };
  }

  async logout(): Promise<void> {
    await mockDelay();
  }

  async deleteAccount(): Promise<void> {
    // No real backend session to tear down in mock mode — mirrors `logout`
    // and lets the caller (useDeleteAccount) clear the local auth session.
    await mockDelay();
  }

  async getSession(): Promise<AuthSession | null> {
    await mockDelay();
    return { token: MOCK_TOKEN, user: currentUser };
  }

  async me(): Promise<User> {
    await mockDelay();
    return currentUser;
  }

  async updateProfile(input: EditProfileInput): Promise<User> {
    await mockDelay();
    currentUser.displayName = input.displayName;
    currentUser.username = input.username;
    currentUser.bio = input.bio && input.bio.length > 0 ? input.bio : null;
    currentUser.isPrivate = input.isPrivate;

    const idx = mutableUsers.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) {
      mutableUsers[idx] = currentUser;
    }
    return currentUser;
  }
}
