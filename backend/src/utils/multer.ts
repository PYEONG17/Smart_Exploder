import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "./app-error.js";

// ─── Upload directory setup ────────────────────────────────────────────────────

const UPLOAD_DIR = path.resolve("uploads/avatars");

// Create directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Multer config ─────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, _file, cb) => {
    // Use userId as filename for easy lookup + auto-overwrite old avatar
    const userId = req.params.id ?? req.user?.id ?? "unknown";
    const ext = ".jpg"; // we'll normalize to .jpg
    cb(null, `${userId}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPEG, PNG, WebP, or GIF images are allowed", 400));
  }
};

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB max
    files: 1,
  },
});

// ─── Helper to get public URL for a saved avatar ──────────────────────────────

export function getAvatarUrl(req: { protocol: string; get: (h: string) => string | undefined }, filename: string): string {
  const baseUrl = process.env.API_BASE_URL ?? `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/avatars/${filename}`;
}
