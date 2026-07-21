import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared field validators
// ---------------------------------------------------------------------------

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Please enter a valid phone number');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or fewer');

const usernameSchema = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(30, 'Username must be 30 characters or fewer')
  .regex(
    /^[a-zA-Z0-9._]+$/,
    'Username can only contain letters, numbers, dots, and underscores'
  );

const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(50, 'Display name must be 50 characters or fewer');

// ---------------------------------------------------------------------------
// Login — identifier accepts either email or a phone number
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  identifier: z.union([emailSchema, phoneSchema], {
    errorMap: () => ({ message: 'Please enter a valid email or phone number' }),
  }),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

export const signupSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    displayName: displayNameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Edit Profile
// ---------------------------------------------------------------------------

export const editProfileSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  bio: z
    .string()
    .max(150, 'Bio must be 150 characters or fewer')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .max(200, 'Link must be 200 characters or fewer')
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean(),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
