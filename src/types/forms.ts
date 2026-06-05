/**
 * Form input types — derived from Zod auth schemas via z.infer.
 * Wire these to React Hook Form via @hookform/resolvers/zod.
 *
 * Usage:
 *   import { zodResolver } from '@hookform/resolvers/zod';
 *   import { loginSchema } from '@/schemas';
 *   import type { LoginInput } from '@/types';
 *
 *   const { register, handleSubmit } = useForm<LoginInput>({
 *     resolver: zodResolver(loginSchema),
 *   });
 */

export type { LoginInput, SignupInput, EditProfileInput } from '@/schemas';
