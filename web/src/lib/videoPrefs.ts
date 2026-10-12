/**
 * Global video sound switch for the web app (Reels + feed), remembered in
 * localStorage — mirrors the app's `videoMuted` preference.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'lumina.videoMuted';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let muted = read();

export function setVideoMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(KEY, next ? '1' : '0');
  } catch {
    // Not persisted (private mode) — still applies for this session.
  }
  for (const l of listeners) l();
}

export function useVideoMuted(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => muted,
  );
}
