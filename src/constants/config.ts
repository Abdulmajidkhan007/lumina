/**
 * App-wide configuration constants.
 * All values are typed; nothing is hardcoded inside screens.
 */

export const Config = {
  /** Default page size for paginated API requests */
  DEFAULT_PAGE_SIZE: 12,

  /** Polling interval for notifications in milliseconds (0 = no polling) */
  NOTIFICATION_POLL_INTERVAL_MS: 30_000,

  /** Maximum length for a post caption */
  MAX_CAPTION_LENGTH: 2_200,

  /** Maximum length for a comment */
  MAX_COMMENT_LENGTH: 1_000,

  /** Story duration cutoff in milliseconds (24 hours) */
  STORY_EXPIRY_MS: 24 * 60 * 60 * 1_000,

  /** Maximum number of images per post carousel */
  MAX_POST_MEDIA_COUNT: 10,

  /** Avatar placeholder URI (used when avatarUrl is null) */
  AVATAR_PLACEHOLDER_URI: 'https://picsum.photos/seed/lumina-default/150/150',

  /**
   * Sentry DSN. Left empty by default — `initSentry()` (src/lib/sentry.ts)
   * no-ops until this is populated with a real DSN from the Sentry project
   * settings. Fill this in before shipping to get crash/error reporting.
   */
  SENTRY_DSN: '',

  /**
   * Google Sign-In web client ID (OAuth `client_type: 3` entry from
   * `google-services.json`). Required by `GoogleSignin.configure()` on both
   * platforms — Android needs it to request an ID token, iOS needs it for
   * the server/backend audience check.
   */
  GOOGLE_WEB_CLIENT_ID:
    '780053612664-2e6rm0silqb00l605kpaacdii8ghhj1v.apps.googleusercontent.com',
} as const;

export type ConfigShape = typeof Config;
