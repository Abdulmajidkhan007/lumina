/**
 * Sentry crash/error reporting bootstrap.
 *
 * `initSentry()` must be called once, as early as possible (top of
 * `App.tsx`, before the component is defined). It's a guarded no-op when
 * `Config.SENTRY_DSN` hasn't been configured yet, so the app never crashes
 * or spams a real Sentry project during local development.
 */

import * as Sentry from '@sentry/react-native';
import { Config } from '@/constants/config';

/**
 * Initializes Sentry when a DSN is configured. Safe to call unconditionally
 * — it's a no-op if `Config.SENTRY_DSN` is empty.
 */
export function initSentry(): void {
  if (Config.SENTRY_DSN.length === 0) {
    return;
  }

  Sentry.init({
    dsn: Config.SENTRY_DSN,
    tracesSampleRate: 0.2,
  });
}
