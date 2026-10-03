import { AppError } from "../../utils/app-error.js";
import { signAccessToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { OAuth2Client } from "google-auth-library";
import { authRepository } from "./repository.js";
import type {
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "./schema.js";
import type { AuthResult, PublicUser } from "./types.js";

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

async function issueAuth(user: PublicUser): Promise<AuthResult> {
  const membership = await authRepository.findActiveTenantMembership(user.id);
  if (!membership) {
    throw new AppError("No active school membership is available", 403);
  }

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: membership.tenantId,
    membershipId: membership.id,
  });
  return { user, token };
}

const googleClient = new OAuth2Client();

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError("Email is already registered", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return issueAuth(toPublicUser(user));
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.passwordHash) {
      throw new AppError("Invalid email or password", 401);
    }

    const matches = await verifyPassword(input.password, user.passwordHash);
    if (!matches) {
      throw new AppError("Invalid email or password", 401);
    }

    return issueAuth(toPublicUser(user));
  },

  async loginWithGoogle(input: GoogleLoginInput): Promise<AuthResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new AppError("Google sign-in is not configured", 503);
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: input.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError("Invalid Google credential", 401);
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new AppError("Google account must have a verified email", 401);
    }

    const googleSub = payload.sub;
    const existingGoogleUser = await authRepository.findByGoogleSub(googleSub);
    if (existingGoogleUser) {
      return issueAuth(toPublicUser(existingGoogleUser));
    }

    const email = payload.email.toLowerCase();
    const existingEmailUser = await authRepository.findByEmail(email);
    if (
      existingEmailUser?.googleSub &&
      existingEmailUser.googleSub !== googleSub
    ) {
      throw new AppError(
        "This email is linked to a different Google account",
        409,
      );
    }
    const user = existingEmailUser
      ? await authRepository.linkGoogleAccount(existingEmailUser.id, {
          googleSub,
          avatar: payload.picture ?? null,
        })
      : await authRepository.createGoogleUser({
          name: payload.name?.trim() || email,
          email,
          googleSub,
          avatar: payload.picture ?? null,
          role: input.role,
        });

    return issueAuth(toPublicUser(user));
  },

  async getMe(userId: string): Promise<PublicUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return toPublicUser(user);
  },

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<PublicUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updated = await authRepository.updateById(userId, {
      name: input.name,
    });
    return toPublicUser(updated);
  },
};
