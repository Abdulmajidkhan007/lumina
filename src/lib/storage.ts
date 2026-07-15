/**
 * Storage utilities:
 *   - secureStorage: thin wrapper around react-native-keychain for auth tokens
 *   - asyncStoragePersister: TanStack Query cache persistence via MMKV
 */

import * as Keychain from 'react-native-keychain';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { mmkvAsyncStorageLike } from './mmkv';

// ---------------------------------------------------------------------------
// Secure token storage — auth tokens only
// ---------------------------------------------------------------------------

const AUTH_TOKEN_KEY = 'lumina_auth_token';
/** Keychain "username" field — unused by lumina but required by the API. */
const KEYCHAIN_USERNAME = 'lumina';

export const secureStorage = {
  async getToken(): Promise<string | null> {
    const result = await Keychain.getGenericPassword({ service: AUTH_TOKEN_KEY });
    // getGenericPassword resolves to `false` (not null) when nothing is stored.
    return result ? result.password : null;
  },

  async setToken(token: string): Promise<void> {
    await Keychain.setGenericPassword(KEYCHAIN_USERNAME, token, {
      service: AUTH_TOKEN_KEY,
    });
  },

  async deleteToken(): Promise<void> {
    await Keychain.resetGenericPassword({ service: AUTH_TOKEN_KEY });
  },
};

// ---------------------------------------------------------------------------
// MMKV-backed persister for TanStack Query offline cache
// ---------------------------------------------------------------------------

/**
 * NOTE: this is now backed by MMKV (via `mmkvAsyncStorageLike`), not
 * AsyncStorage. The export name `asyncStoragePersister` is kept as-is so
 * existing consumers (e.g. `src/providers/index.tsx`) keep compiling
 * unchanged — `@tanstack/query-async-storage-persister` only requires an
 * AsyncStorage-*shaped* interface, which MMKV is wrapped to satisfy.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: mmkvAsyncStorageLike,
  key: 'lumina_query_cache',
  throttleTime: 1000,
});
