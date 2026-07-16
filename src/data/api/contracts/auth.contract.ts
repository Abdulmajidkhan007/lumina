import type { User } from '@/types/models';
import type { LoginInput, SignupInput, EditProfileInput } from '@/types/forms';

// ---------------------------------------------------------------------------
// Auth session shape returned from login / getSession
// ---------------------------------------------------------------------------

export type AuthSession = {
  token: string;
  user: User;
};

// ---------------------------------------------------------------------------
// IAuthApi — the swap boundary for authentication
// ---------------------------------------------------------------------------

export interface IAuthApi {
  login(input: LoginInput): Promise<AuthSession>;
  signup(input: SignupInput): Promise<AuthSession>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  me(): Promise<User>;
  updateProfile(input: EditProfileInput): Promise<User>;
  /**
   * Permanently deletes the current user's account (Play Store / App Store
   * in-app account deletion requirement). Removes the backing profile
   * record and the auth credential, then the caller is expected to clear
   * any local session state.
   */
  deleteAccount(): Promise<void>;
}
