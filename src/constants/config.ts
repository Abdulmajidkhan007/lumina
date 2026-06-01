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
} as const;

export type ConfigShape = typeof Config;
