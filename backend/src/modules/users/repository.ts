import prisma from "../../config/db.js";

export const usersRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  updateProfile(id: string, data: { name?: string; bio?: string | null }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  updateAvatar(id: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
    });
  },
};
