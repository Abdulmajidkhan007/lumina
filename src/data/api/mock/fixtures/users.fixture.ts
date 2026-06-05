import type { User, UserSummary } from '@/types/models';
import {
  userIdSchema,
} from '@/schemas';
import { createSeededRng, seededInt } from './seed';

const rng = createSeededRng('lumina-users-v1');

function makeUser(
  index: number,
  username: string,
  displayName: string,
  bio: string | null,
  isVerified: boolean,
): User {
  const id = userIdSchema.parse(`user-${String(index).padStart(3, '0')}`);
  const avatarSeed = `avatar-${username}`;
  return {
    id,
    username,
    displayName,
    avatarUrl: `https://picsum.photos/seed/${avatarSeed}/150/150`,
    bio,
    isVerified,
    isPrivate: false,
    followerCount: seededInt(100, 250_000, rng),
    followingCount: seededInt(50, 1_500, rng),
    postCount: seededInt(10, 400, rng),
    isFollowedByMe: index !== 0 && index % 3 !== 0,
    isMe: index === 0,
    createdAt: `2022-0${(index % 9) + 1}-${String((index % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
  };
}

export const mockUsers: User[] = [
  makeUser(0, 'lumina_you', 'You (Current User)', 'Living my best life ✦', false),
  makeUser(1, 'aurora_vibes', 'Aurora Vega', 'Photographer & dreamer 📷', true),
  makeUser(2, 'solar_lens', 'Marco Solaris', 'Street photography from Tokyo', false),
  makeUser(3, 'nova_creates', 'Nova Chen', 'Art director & illustrator', true),
  makeUser(4, 'dusk_til_dawn', 'Elara Moon', 'Sunset hunter 🌅', false),
  makeUser(5, 'pixel_poet', 'Jasper Wren', 'Words + images', false),
  makeUser(6, 'urban_frames', 'Sasha Reyes', 'City life & architecture', true),
  makeUser(7, 'wild_palette', 'Finn Archer', 'Nature photographer', false),
  makeUser(8, 'still_motion', 'Livia Park', 'Minimalist aesthetics ◻', false),
  makeUser(9, 'echo_light', 'Theo Bauer', 'Film photographer 🎞', false),
  makeUser(10, 'morning_haze', 'Iris Costa', 'Coffee & slow mornings', false),
  makeUser(11, 'the_grid_co', 'Grid Studio', 'Design collective', true),
];

export const currentUser: User = mockUsers[0]!;

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
  };
}

/** Mutable copy so mutations (follow/unfollow) can update in-memory state */
export const mutableUsers: User[] = mockUsers.map((u) => ({ ...u }));
