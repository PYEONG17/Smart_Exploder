import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { AppError } from "./app-error.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tenantId?: string;
  membershipId?: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }
  return secret;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, getSecret(), options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === "string" || !decoded.sub || !decoded.email || !decoded.role) {
      throw new AppError("Invalid token", 401);
    }
    return {
      sub: decoded.sub,
      email: decoded.email as string,
      role: decoded.role as Role,
      tenantId: typeof decoded.tenantId === "string" ? decoded.tenantId : undefined,
      membershipId:
        typeof decoded.membershipId === "string" ? decoded.membershipId : undefined,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Invalid or expired token", 401);
  }
}
