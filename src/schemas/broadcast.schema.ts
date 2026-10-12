/**
 * Admin announcements (`broadcasts/{id}`) — the compose form schema (mirrors
 * the `broadcasts` rule in firestore.rules) and the domain model.
 */
import { z } from 'zod';

export const BROADCAST_TITLE_MAX = 120;
export const BROADCAST_BODY_MAX = 2000;
export const BROADCAST_LINK_MAX = 500;

export const broadcastFormSchema = z.object({
  title: z.string().trim().min(1, 'titleRequired').max(BROADCAST_TITLE_MAX, 'titleTooLong'),
  body: z.string().trim().min(1, 'bodyRequired').max(BROADCAST_BODY_MAX, 'bodyTooLong'),
  link: z
    .string()
    .trim()
    .max(BROADCAST_LINK_MAX, 'linkInvalid')
    .refine((v) => v.length === 0 || /^https?:\/\/[^ ]+$/.test(v), 'linkInvalid'),
});

export type BroadcastFormInput = z.input<typeof broadcastFormSchema>;
export type BroadcastFormValues = z.output<typeof broadcastFormSchema>;

/** Error codes the form schema emits — mapped to i18n keys in the UI. */
export type BroadcastFormError =
  | 'titleRequired'
  | 'titleTooLong'
  | 'bodyRequired'
  | 'bodyTooLong'
  | 'linkInvalid';

export const broadcastSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  body: z.string(),
  link: z.string().nullable(),
  /** ISO 8601 (from the server Timestamp). */
  createdAt: z.string(),
});

export type Broadcast = z.infer<typeof broadcastSchema>;
