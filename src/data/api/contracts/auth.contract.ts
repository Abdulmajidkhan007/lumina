import type { User } from '@/types/models';
import type { LoginInput, SignupInput } from '@/types/forms';

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
}
