import { useEffect, useState } from 'react';
import { fetchLandingScreens, type LandingScreens } from '../lib/landing';

/** Admin-uploaded screenshots; empty (illustrations shown) until loaded or on error. */
export function useLandingScreens(): LandingScreens {
  const [screens, setScreens] = useState<LandingScreens>({});
  useEffect(() => {
    let alive = true;
    fetchLandingScreens()
      .then((s) => {
        if (alive) setScreens(s);
      })
      .catch((error: unknown) => console.warn('[landing] screenshots not loaded', error));
    return () => {
      alive = false;
    };
  }, []);
  return screens;
}
