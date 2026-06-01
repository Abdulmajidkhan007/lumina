/**
 * Lumina — Create Post feature types
 *
 * Zod schema + inferred type for the caption form.
 * Separate from domain models — this is form-layer only.
 */

import { z } from 'zod';
import { Config } from '@/constants/config';

// ---------------------------------------------------------------------------
// Caption form schema
// ---------------------------------------------------------------------------

export const createPostSchema = z.object({
  caption: z
    .string()
    .max(Config.MAX_CAPTION_LENGTH, {
      message: `Caption cannot exceed ${Config.MAX_CAPTION_LENGTH} characters`,
    })
    .default(''),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;
