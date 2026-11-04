import { AppError } from "../../utils/app-error.js";
import { usersRepository } from "./repository.js";
import type { UpdateProfileInput } from "./schema.js";
import type { PublicUser } from "../auth/types.js";

// ─── Hàm hỗ trợ ───────────────────────────────────────────────────────────────

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

// ─── Dịch vụ ──────────────────────────────────────────────────────────────────

export const usersService = {
  /**
   * GET /api/users/me
   * Trả về người dùng hiện được xác thực từ cơ sở dữ liệu (luôn cập nhật).
   */
  async getMe(userId: string): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return toPublicUser(user);
  },

  /**
   * PATCH /api/users/me/profile
   * Cập nhật tên và/hoặc tiểu sử.
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
   * Lưu URL của tệp đã tải lên vào cơ sở dữ liệu.
   */
  async uploadAvatar(userId: string, avatarUrl: string): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const updated = await usersRepository.updateAvatar(userId, avatarUrl);
    return toPublicUser(updated);
  },

  /**
   * GET /api/users/:id/avatar/random
   * Lấy ảnh đại diện ngẫu nhiên từ DiceBear và lưu vào cơ sở dữ liệu.
   * Trả về thông tin người dùng đã cập nhật.
   */
  async randomAvatar(userId: string): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    // DiceBear tạo ảnh đại diện xác định nhưng có thể ngẫu nhiên hóa.
    // Dùng seed ngẫu nhiên để mỗi lần gọi tạo ra một ảnh đại diện khác nhau.
    const seed = `${userId}-${Date.now()}`;
    // Kiểu lorelei rất phù hợp với ứng dụng trường học.
    const avatarUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    const updated = await usersRepository.updateAvatar(userId, avatarUrl);
    return toPublicUser(updated);
  },
};
