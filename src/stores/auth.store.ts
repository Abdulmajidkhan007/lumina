import { create } from 'zustand';
import type { User } from '@/types/models';
import { secureStorage } from '@/lib/storage';
import { authApi } from '@/data/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

export type AuthSession = {
  token: string;
  user: User;
};

type AuthState = {
  session: AuthSession | null;
  status: AuthStatus;
};

type AuthActions = {
  setSession(session: AuthSession): void;
  clearSession(): void;
  /** Swaps the session's user object in place, keeping the existing token */
  updateCurrentUser(user: User): void;
  /** Reads the stored token and fetches the current user to rehydrate state */
  hydrate(): Promise<void>;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  session: null,
  status: 'idle',

  setSession(session: AuthSession) {
    void secureStorage.setToken(session.token);
    set({ session, status: 'authenticated' });
  },

  clearSession() {
    void secureStorage.deleteToken();
    set({ session: null, status: 'unauthenticated' });
  },

  updateCurrentUser(user: User) {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, user } });
  },

  async hydrate() {
    set({ status: 'loading' });
    try {
      const token = await secureStorage.getToken();
      if (!token) {
        set({ session: null, status: 'unauthenticated' });
        return;
      }
      const user = await authApi.me();
      set({ session: { token, user }, status: 'authenticated' });
    } catch {
      set({ session: null, status: 'unauthenticated' });
    }
  },
}));

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

export const useCurrentUser = () =>
  useAuthStore((s) => s.session?.user ?? null);

export const useAuthStatus = () => useAuthStore((s) => s.status);
