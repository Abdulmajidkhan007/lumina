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
  updateProfile(input: EditProfileInput, avatarLocalUri?: string): Promise<User>;
  /** Switches the current account between personal and professional (creator/business). */
  setProfessionalAccount(enabled: boolean): Promise<User>;
  /**
   * Sends a password-reset email to the given address. Resolves once the
   * request has been accepted by the backend — it does not indicate whether
   * the address actually has an account (backends intentionally don't leak
   * that to avoid account enumeration).
   */
  resetPassword(email: string): Promise<void>;
  /**
   * Returns the signed-in user's email address, or null if there isn't one
   * on file. The `User` domain model has no `email` field (it's
   * viewer-relative/session data, not a public profile attribute), so flows
   * that need it — e.g. a "forgot password?" link inside a settings screen —
   * read it through this rather than threading it through client state.
   */
  getCurrentUserEmail(): Promise<string | null>;
  /**
   * Changes the signed-in user's password. Implementations must verify
   * `currentPassword` against the live credential before applying
   * `newPassword` — never allow an unauthenticated password swap.
   * Rejects with a user-facing message when `currentPassword` is wrong.
   */
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  /**
   * Permanently deletes the current user's account (Play Store / App Store
   * in-app account deletion requirement). Removes the backing profile
   * record and the auth credential, then the caller is expected to clear
   * any local session state.
   */
  deleteAccount(): Promise<void>;
  /**
   * Signs in (or, on first use, silently creates an account for) the user
   * via their Google identity. Implementations should throw
   * `Error('cancelled')` when the user backs out of the native picker so
   * callers can distinguish "no-op" from a real failure and skip showing an
   * error banner for it.
   */
  loginWithGoogle(): Promise<AuthSession>;
  /**
   * Whether the signed-in user's email address has been verified.
   * Google-authenticated users are treated as verified (Google already
   * verified the address). Returns `false` when there is no signed-in user.
   */
  isEmailVerified(): boolean;
  /**
   * Re-sends the verification email to the signed-in user's address.
   * No-op (resolves) if there is no signed-in user or it's already verified.
   */
  resendVerificationEmail(): Promise<void>;
}
