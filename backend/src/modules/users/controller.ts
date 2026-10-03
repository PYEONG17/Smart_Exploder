import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { updateProfileSchema } from "./schema.js";
import { usersService } from "./service.js";
import { getAvatarUrl } from "../../utils/multer.js";

// ─── GET /api/users/me ────────────────────────────────────────────────────────

export async function getMe(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const data = await usersService.getMe(req.user.id);
  res.json(success(data, "User fetched successfully"));
}

// ─── PATCH /api/users/me/profile ──────────────────────────────────────────────

export async function updateProfile(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const body = updateProfileSchema.parse(req.body);
  const data = await usersService.updateProfile(req.user.id, body);
  res.json(success(data, "Profile updated successfully"));
}

// ─── POST /api/users/:id/avatar ───────────────────────────────────────────────

export async function uploadAvatar(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);

  const targetId = String(req.params.id);

  // Only own user or admin can change avatar
  if (req.user.id !== targetId && req.user.role !== "ADMIN") {
    throw new AppError("Forbidden: you can only change your own avatar", 403);
  }

  if (!req.file) {
    throw new AppError("No image file provided", 400);
  }

  // Build public URL for the uploaded file
  const avatarUrl = getAvatarUrl(req, req.file.filename);
  const data = await usersService.uploadAvatar(targetId, avatarUrl);
  res.json(success(data, "Avatar uploaded successfully"));
}

// ─── GET /api/users/:id/avatar/random ────────────────────────────────────────

export async function randomAvatar(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);

  const targetId = String(req.params.id);

  // Only own user or admin
  if (req.user.id !== targetId && req.user.role !== "ADMIN") {
    throw new AppError("Forbidden: you can only change your own avatar", 403);
  }

  const data = await usersService.randomAvatar(targetId);
  res.json(success(data, "Random avatar applied successfully"));
}
