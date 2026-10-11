import { useCallback, useState } from 'react';

export const ADMIN_THEMES = ['system', 'light', 'dark'] as const;
export type AdminTheme = (typeof ADMIN_THEMES)[number];

const STORAGE_KEY = 'lumina.admin.theme';

function isAdminTheme(value: unknown): value is AdminTheme {
  return typeof value === 'string' && (ADMIN_THEMES as readonly string[]).includes(value);
}

function initialTheme(): AdminTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isAdminTheme(saved)) return saved;
  } catch {
    // Storage blocked — follow the system.
  }
  return 'system';
}

/** Admin panel theme (system / light / dark), remembered on this device. */
export function useAdminTheme(): [AdminTheme, (theme: AdminTheme) => void] {
  const [theme, setThemeState] = useState<AdminTheme>(initialTheme);
  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Applies for this session only.
    }
  }, []);
  return [theme, setTheme];
}
