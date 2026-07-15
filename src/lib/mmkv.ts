/**
 * MMKV-backed storage adapters.
 *
 * Exposes a single configured `react-native-mmkv` instance plus two adapters
 * built on top of it:
 *   - `mmkvZustandStorage`: a zustand `StateStorage` (used by persisted
 *     stores via `createJSONStorage(() => mmkvZustandStorage)`).
 *   - `mmkvAsyncStorageLike`: an AsyncStorage-shaped (async get/set/remove)
 *     wrapper, since `@tanstack/query-async-storage-persister` expects a
 *     promise-based interface. MMKV itself is fully synchronous; the
 *     wrapper just resolves immediately.
 *
 * MMKV requires a native module, so avoid importing this file at the top
 * level of anything that needs to run under Jest without native bindings —
 * it is only pulled in transitively via the zustand stores / query storage,
 * both of which are covered by the project's test mocks.
 */

import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

/** Single shared MMKV instance for the whole app. */
export const mmkvStorage = new MMKV({
  id: 'lumina-mmkv',
});

// ---------------------------------------------------------------------------
// Zustand StateStorage adapter
// ---------------------------------------------------------------------------

/**
 * Zustand `persist` middleware storage adapter backed by MMKV.
 * Use as: `createJSONStorage(() => mmkvZustandStorage)`.
 */
export const mmkvZustandStorage: StateStorage = {
  getItem(name: string): string | null {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  setItem(name: string, value: string): void {
    mmkvStorage.set(name, value);
  },
  removeItem(name: string): void {
    mmkvStorage.delete(name);
  },
};

// ---------------------------------------------------------------------------
// AsyncStorage-like adapter (for @tanstack/query-async-storage-persister)
// ---------------------------------------------------------------------------

/** Minimal AsyncStorage-shaped interface the query persister expects. */
export type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/**
 * Wraps the synchronous MMKV instance in an AsyncStorage-compatible shape so
 * it can be passed to `createAsyncStoragePersister({ storage })`.
 */
export const mmkvAsyncStorageLike: AsyncStorageLike = {
  async getItem(key: string): Promise<string | null> {
    const value = mmkvStorage.getString(key);
    return value ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    mmkvStorage.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    mmkvStorage.delete(key);
  },
};
