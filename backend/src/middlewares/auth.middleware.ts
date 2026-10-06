import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  const payload = verifyAccessToken(token);
  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
    membershipId: payload.membershipId,
  };
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return next();
  if (!header.startsWith("Bearer ")) throw new AppError("Invalid authorization header", 401);
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new AppError("Authentication required", 401);
  const payload = verifyAccessToken(token);
  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
    membershipId: payload.membershipId,
  };
  next();
}

export function requireRole(
  ...allowedRoles: NonNullable<Request["user"]>["role"][]
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    }
    next();
  };
}
