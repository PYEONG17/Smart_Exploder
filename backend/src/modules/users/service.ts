import { AppError } from "../../utils/app-error.js";
import { usersRepository } from "./repository.js";
import type { UpdateProfileInput } from "./schema.js";
import type { PublicUser } from "../auth/types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: PublicUser["role"];
  avatar: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const usersService = {
  /**
   * GET /api/users/me
   * Returns current authenticated user from DB (always fresh).
   */
  async getMe(userId: string): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return toPublicUser(user);
  },

  /**
   * PATCH /api/users/me/profile
   * Update name and/or bio.
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const updated = await usersRepository.updateProfile(userId, {
      name: input.name,
      bio: input.bio,
    });
    return toPublicUser(updated);
  },

  /**
   * POST /api/users/:id/avatar
   * Save the uploaded file URL to DB.
   */
  async uploadAvatar(userId: string, avatarUrl: string): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const updated = await usersRepository.updateAvatar(userId, avatarUrl);
    return toPublicUser(updated);
  },

  /**
   * GET /api/users/:id/avatar/random
   * Fetch a random avatar from DiceBear and save it to DB.
   * Returns the updated user.
   */
  async randomAvatar(userId: string): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    // DiceBear generates deterministic-but-randomizable avatars
    // Use a random seed so each call gives a different avatar
    const seed = `${userId}-${Date.now()}`;
    // lorelei style looks great for a school app
    const avatarUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    const updated = await usersRepository.updateAvatar(userId, avatarUrl);
    return toPublicUser(updated);
  },
};
