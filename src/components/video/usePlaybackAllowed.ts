import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * True only while the hosting screen is focused AND the app is in the
 * foreground. Videos gate `paused` on it, so they stop when the user leaves
 * the screen (another tab, a pushed screen) or backgrounds the app.
 */
export function usePlaybackAllowed(): boolean {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  return isFocused && appActive;
}
