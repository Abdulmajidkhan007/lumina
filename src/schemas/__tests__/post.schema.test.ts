import { mediaSchema, postSchema } from '@/schemas/post.schema';

const validAuthor = {
  id: 'user-1',
  username: 'jane',
  displayName: 'Jane Doe',
  avatarUrl: 'https://example.com/avatar.png',
  isVerified: false,
};

const validImageMedia = {
  type: 'image' as const,
  uri: 'https://example.com/photo.jpg',
  width: 1080,
  height: 1350,
};

const validVideoMedia = {
  type: 'video' as const,
  uri: 'https://example.com/clip.mp4',
  width: 1080,
  height: 1920,
  thumbnailUri: 'https://example.com/clip-thumb.jpg',
  durationMs: 15000,
};

describe('mediaSchema', () => {
  it('accepts a valid image media object', () => {
    const result = mediaSchema.safeParse(validImageMedia);
    expect(result.success).toBe(true);
  });

  it('accepts a valid video media object with optional fields', () => {
    const result = mediaSchema.safeParse(validVideoMedia);
    expect(result.success).toBe(true);
  });

  it('accepts a video media object without the optional fields', () => {
    const result = mediaSchema.safeParse({
      type: 'video',
      uri: 'https://example.com/clip.mp4',
      width: 1080,
      height: 1920,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a media object with an unknown discriminant', () => {
    const result = mediaSchema.safeParse({
      type: 'gif',
      uri: 'https://example.com/anim.gif',
      width: 100,
      height: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an image media object with a non-url uri', () => {
    const result = mediaSchema.safeParse({
      type: 'image',
      uri: 'not-a-url',
      width: 100,
      height: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe('postSchema', () => {
  const validPost = {
    id: 'post-1',
    author: validAuthor,
    media: [validImageMedia],
    caption: 'A caption',
    likeCount: 12,
    commentCount: 3,
    isLikedByMe: false,
    isSavedByMe: true,
    createdAt: new Date().toISOString(),
  };

  it('parses a valid post fixture', () => {
    const result = postSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('parses a valid post fixture with a null caption and multiple media items', () => {
    const result = postSchema.safeParse({
      ...validPost,
      caption: null,
      media: [validImageMedia, validVideoMedia],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a post with an empty media array', () => {
    const result = postSchema.safeParse({ ...validPost, media: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a post with a malformed createdAt timestamp', () => {
    const result = postSchema.safeParse({
      ...validPost,
      createdAt: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });
});
