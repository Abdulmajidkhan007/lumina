/**
 * Storage utilities:
 *   - secureStorage: thin wrapper around react-native-keychain for auth tokens
 *   - asyncStoragePersister: TanStack Query cache persistence via AsyncStorage
 */

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

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
// AsyncStorage-backed persister for TanStack Query offline cache
// ---------------------------------------------------------------------------

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'lumina_query_cache',
  throttleTime: 1000,
});
