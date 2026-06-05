/**
 * Storage utilities:
 *   - secureStorage: thin wrapper around expo-secure-store for auth tokens
 *   - asyncStoragePersister: TanStack Query cache persistence via AsyncStorage
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// ---------------------------------------------------------------------------
// Secure token storage — auth tokens only
// ---------------------------------------------------------------------------

const AUTH_TOKEN_KEY = 'lumina_auth_token';

export const secureStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  },

  async deleteToken(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
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
