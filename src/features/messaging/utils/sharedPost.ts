/**
 * Lumina — shared-post preview extraction
 *
 * `Message` (the Zod-validated model in `@/schemas`) intentionally has no
 * `sharedPost` field — the messaging API layer (mock + Firebase) attaches it
 * as an extra, denormalized property on "shared a post" messages so
 * rendering a preview card never needs an extra `getPost` read. That extra
 * field survives the trip through TanStack Query at runtime (TypeScript
 * return-type annotations don't strip object properties), but it isn't part
 * of the `Message` type screens/hooks see statically.
 *
 * `readSharedPost` bridges that gap: it reads the field back off the raw
 * object defensively (never trusting it blindly) instead of widening the
 * shared `Message` model just for this one rendering concern.
 */
import { z } from 'zod';
import { postIdSchema } from '@/schemas';
import type { Message } from '@/types/models';

const sharedPostPreviewSchema = z.object({
  postId: postIdSchema,
  thumbnailUri: z.string(),
  authorUsername: z.string(),
});

export type SharedPostPreview = z.infer<typeof sharedPostPreviewSchema>;

/** Reads and validates the optional `sharedPost` snapshot off a message, if present. */
export function readSharedPost(message: Message): SharedPostPreview | undefined {
  const raw = message as unknown as Record<string, unknown>;
  const result = sharedPostPreviewSchema.safeParse(raw.sharedPost);
  return result.success ? result.data : undefined;
}
