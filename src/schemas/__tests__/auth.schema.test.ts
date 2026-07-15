import {
  loginSchema,
  signupSchema,
  editProfileSchema,
} from '@/schemas/auth.schema';

describe('loginSchema', () => {
  it('accepts a valid email identifier + non-empty password', () => {
    const result = loginSchema.safeParse({
      identifier: 'user@example.com',
      password: 'anything',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid phone identifier + non-empty password', () => {
    const result = loginSchema.safeParse({
      identifier: '+14155551234',
      password: 'anything',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an identifier that is neither a valid email nor a valid phone number', () => {
    const result = loginSchema.safeParse({
      identifier: 'not-an-email-or-phone',
      password: 'anything',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      identifier: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('signupSchema', () => {
  const validPayload = {
    email: 'user@example.com',
    username: 'user.name_1',
    displayName: 'User Name',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('accepts a valid signup payload', () => {
    const result = signupSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects when password and confirmPassword do not match', () => {
    const result = signupSchema.safeParse({
      ...validPayload,
      confirmPassword: 'somethingElse123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toEqual(['confirmPassword']);
      expect(issue?.message).toBe('Passwords do not match');
    }
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      ...validPayload,
      password: 'short1',
      confirmPassword: 'short1',
    });
    expect(result.success).toBe(false);
  });
});

describe('editProfileSchema', () => {
  const base = {
    displayName: 'User Name',
    username: 'user.name',
    isPrivate: false,
  };

  it('accepts a bio at exactly the 150 character limit', () => {
    const result = editProfileSchema.safeParse({
      ...base,
      bio: 'a'.repeat(150),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a bio longer than 150 characters', () => {
    const result = editProfileSchema.safeParse({
      ...base,
      bio: 'a'.repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it('accepts an empty string bio', () => {
    const result = editProfileSchema.safeParse({ ...base, bio: '' });
    expect(result.success).toBe(true);
  });

  it('accepts a missing bio', () => {
    const result = editProfileSchema.safeParse(base);
    expect(result.success).toBe(true);
  });
});
