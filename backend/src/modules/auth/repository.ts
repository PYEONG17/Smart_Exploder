import prisma from "../../config/db.js";

const DEFAULT_TENANT_SLUG = "smart-stem";

async function createUserWithMembership(data: {
  name: string;
  email: string;
  passwordHash: string | null;
  googleSub?: string;
  avatar?: string | null;
  role: "STUDENT" | "TEACHER";
}) {
  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { slug: DEFAULT_TENANT_SLUG },
    });
    if (!tenant) {
      throw new Error(
        `Default tenant "${DEFAULT_TENANT_SLUG}" is missing; apply the tenant migration`,
      );
    }

    const role = await tx.tenantRole.findUnique({
      where: {
        tenantId_roleKey: {
          tenantId: tenant.id,
          roleKey: data.role,
        },
      },
    });
    if (!role) {
      throw new Error(`Tenant role "${data.role}" is missing`);
    }

    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        googleSub: data.googleSub,
        avatar: data.avatar ?? undefined,
        role: data.role,
      },
    });
    const membership = await tx.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });
    await tx.userRole.create({
      data: {
        tenantId: tenant.id,
        membershipId: membership.id,
        roleId: role.id,
      },
    });

    return user;
  });
}

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByGoogleSub(googleSub: string) {
    return prisma.user.findUnique({ where: { googleSub } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: {
    name: string;
    email: string;
    passwordHash: string | null;
    role: "STUDENT" | "TEACHER";
  }) {
    return createUserWithMembership(data);
  },

  createGoogleUser(data: {
    name: string;
    email: string;
    googleSub: string;
    avatar: string | null;
    role: "STUDENT" | "TEACHER";
  }) {
    return createUserWithMembership({
      ...data,
      passwordHash: null,
    });
  },

  findActiveTenantMembership(userId: string) {
    return prisma.tenantMembership.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        deletedAt: null,
        tenant: {
          status: "ACTIVE",
          deletedAt: null,
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        tenantId: true,
      },
    });
  },

  linkGoogleAccount(
    id: string,
    data: { googleSub: string; avatar: string | null },
  ) {
    return prisma.user.update({
      where: { id },
      data: {
        googleSub: data.googleSub,
        avatar: data.avatar ?? undefined,
      },
    });
  },

  updateById(id: string, data: { name?: string }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
};
