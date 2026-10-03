import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import type { Request } from "express";
import { AppError } from "./app-error.js";

const MEDIA_ROOT = path.resolve("uploads/course-media");
const IMAGE_LIMIT_BYTES = 15 * 1024 * 1024;
const VIDEO_LIMIT_BYTES = 1024 * 1024 * 1024;

const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const videoExtensions: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
};

const documentExtensions: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "text/plain": ".txt",
};

function ensureUserUploadDirectory(req: Request): string {
  if (!req.user) throw new AppError("Authentication required", 401);
  const directory = path.join(MEDIA_ROOT, req.user.id);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function createMediaUpload(
  allowedTypes: Record<string, string>,
  fileSize: number,
) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, _file, callback) => {
        try {
          callback(null, ensureUserUploadDirectory(req));
        } catch (error) {
          callback(
            error instanceof Error
              ? error
              : new Error("Unable to prepare upload directory"),
            "",
          );
        }
      },
      filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${allowedTypes[file.mimetype] ?? ""}`);
      },
    }),
    fileFilter: (_req, file, callback) => {
      if (!allowedTypes[file.mimetype]) {
        callback(new AppError("Unsupported media file type", 400));
        return;
      }
      callback(null, true);
    },
    limits: { fileSize, files: 1 },
  });
}

export const courseThumbnailUpload = createMediaUpload(
  imageExtensions,
  IMAGE_LIMIT_BYTES,
).single("file");

export const lessonVideoUpload = createMediaUpload(
  videoExtensions,
  VIDEO_LIMIT_BYTES,
).single("file");

export const lessonMaterialUpload = createMediaUpload(
  documentExtensions,
  50 * 1024 * 1024,
).single("file");

export function getCourseMediaUrl(
  req: Request,
  userId: string,
  filename: string,
): string {
  const configuredBaseUrl = process.env.API_BASE_URL;
  const baseUrl = configuredBaseUrl
    ? new URL(configuredBaseUrl).origin
    : `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/course-media/${encodeURIComponent(userId)}/${encodeURIComponent(filename)}`;
}

// Best-effort removal of files previously saved by this server; external URLs are ignored.
export async function removeCourseMediaByUrls(urls: (string | null | undefined)[]) {
  const marker = "/uploads/course-media/";
  await Promise.all(
    urls.map(async (url) => {
      if (!url) return;
      const index = url.indexOf(marker);
      if (index < 0) return;
      const relative = decodeURIComponent(
        url.slice(index + marker.length).split(/[?#]/)[0] ?? "",
      );
      const target = path.resolve(MEDIA_ROOT, relative);
      if (!target.startsWith(MEDIA_ROOT + path.sep)) return;
      await fs.promises.rm(target, { force: true }).catch(() => undefined);
    }),
  );
}
