import { z } from 'zod';
import { userIdSchema, isoTimestampSchema } from './common.schema';

// ---------------------------------------------------------------------------
// UserSummary — lightweight representation used inside other models
// ---------------------------------------------------------------------------

export const userSummarySchema = z.object({
  id: userIdSchema,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  isVerified: z.boolean(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

// ---------------------------------------------------------------------------
// Full User profile
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  id: userIdSchema,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  /** Optional external link shown on the profile ("link in bio"). */
  website: z.string().nullable(),
  /** True when this is a professional (creator/business) account with Insights. */
  isProfessional: z.boolean().optional(),
  isVerified: z.boolean(),
  isPrivate: z.boolean(),
  followerCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
  postCount: z.number().int().nonnegative(),
  /** Whether the currently authenticated user follows this profile */
  isFollowedByMe: z.boolean(),
  /** Whether this profile belongs to the currently authenticated user */
  isMe: z.boolean(),
  createdAt: isoTimestampSchema,
});

export type User = z.infer<typeof userSchema>;
