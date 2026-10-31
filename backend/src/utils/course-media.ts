import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import type { Request } from "express";
import { AppError } from "./app-error.js";

const MEDIA_ROOT = path.resolve("uploads/course-media");
const IMAGE_LIMIT_BYTES = 15 * 1024 * 1024;
const VIDEO_LIMIT_BYTES = 1024 * 1024 * 1024;
const MODEL_3D_LIMIT_BYTES = 100 * 1024 * 1024;

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
const model3DExtensions: Record<string, string> = {
  "model/gltf-binary": ".glb",
  "application/octet-stream": ".glb",
};
const labAttachmentExtensions: Record<string, string> = {
  ...imageExtensions,
  ...videoExtensions,
  ...documentExtensions,
  ...model3DExtensions,
  "text/html": ".html",
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
        const isHtmlFile = [".html", ".htm"].includes(
          path.extname(file.originalname).toLowerCase(),
        );
        const isHtmlMimeType = [
          "",
          "text/html",
          "application/octet-stream",
        ].includes(file.mimetype);
        const extension =
          isHtmlFile && isHtmlMimeType
            ? ".html"
            : allowedTypes[file.mimetype] ?? "";
        callback(null, `${randomUUID()}${extension}`);
      },
    }),
    fileFilter: (_req, file, callback) => {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const isHtmlFile = [".html", ".htm"].includes(fileExtension);
      const isHtmlMimeType = ["", "text/html", "application/octet-stream"].includes(
        file.mimetype,
      );
      if (!allowedTypes[file.mimetype] && !(isHtmlFile && isHtmlMimeType)) {
        callback(new AppError("Unsupported media file type", 400));
        return;
      }
      if (
        allowedTypes[file.mimetype] === ".glb" &&
        fileExtension !== ".glb" &&
        !isHtmlFile
      ) {
        callback(new AppError("3D models must use the .glb file format", 400));
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

export const lesson3DModelUpload = createMediaUpload(
  model3DExtensions,
  MODEL_3D_LIMIT_BYTES,
).single("file");

export const lab3DModelUpload = createMediaUpload(
  model3DExtensions,
  MODEL_3D_LIMIT_BYTES,
).single("file");

export const customLabAttachmentsUpload = createMediaUpload(
  labAttachmentExtensions,
  500 * 1024 * 1024,
).array("files", 10);

export async function isValidGlbFile(filePath: string): Promise<boolean> {
  const file = await fs.promises.open(filePath, "r");
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await file.read(header, 0, header.length, 0);
    const fileStats = await file.stat();
    return (
      bytesRead === header.length &&
      header.toString("ascii", 0, 4) === "glTF" &&
      header.readUInt32LE(4) === 2 &&
      header.readUInt32LE(8) === fileStats.size
    );
  } finally {
    await file.close();
  }
}

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

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "\"": "&quot;",
      "'": "&apos;",
    };
    return entities[character] ?? character;
  });
}

export async function createCustomLabThumbnail(
  req: Request,
  userId: string,
  title: string,
  subject: string,
  grade: string,
): Promise<string> {
  const directory = ensureUserUploadDirectory(req);
  const filename = `${randomUUID()}.svg`;
  const subjectLabels: Record<string, string> = {
    science: "KHOA HỌC TỰ NHIÊN",
    physics: "VẬT LÝ",
    chemistry: "HÓA HỌC",
    biology: "SINH HỌC",
  };
  const titleCharacters = Array.from(title.trim());
  const safeTitle = escapeXml(
    titleCharacters.slice(0, 28).join("") +
      (titleCharacters.length > 28 ? "…" : ""),
  );
  const subjectLabel = escapeXml(subjectLabels[subject] ?? "THÍ NGHIỆM");
  const safeGrade = escapeXml(grade);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#312e81"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a5f3fc"/>
      <stop offset="1" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="40" fill="url(#background)"/>
  <circle cx="1050" cy="90" r="220" fill="#ffffff" opacity=".08"/>
  <circle cx="1080" cy="570" r="300" fill="#67e8f9" opacity=".12"/>
  <rect x="76" y="76" width="1048" height="478" rx="32" fill="#ffffff" opacity=".08"/>
  <g transform="translate(880 174)" fill="none" stroke="#e0f2fe" stroke-linecap="round" stroke-linejoin="round" stroke-width="20">
    <path d="M75 0h110M100 0v135L23 293a35 35 0 0 0 31 51h152a35 35 0 0 0 31-51l-77-158V0"/>
    <path d="M55 249h170" stroke="url(#glass)" stroke-width="52"/>
    <circle cx="107" cy="240" r="9" fill="#fff" stroke="none"/>
    <circle cx="171" cy="218" r="7" fill="#fff" stroke="none"/>
  </g>
  <text x="116" y="177" fill="#bfdbfe" font-family="Arial, sans-serif" font-size="27" font-weight="700" letter-spacing="4">${subjectLabel}</text>
  <text x="116" y="230" fill="#dbeafe" font-family="Arial, sans-serif" font-size="24" font-weight="600">LAB ẢO  ·  LỚP ${safeGrade}</text>
  <text x="116" y="338" fill="#ffffff" font-family="Arial, sans-serif" font-size="54" font-weight="700">${safeTitle}</text>
  <text x="116" y="405" fill="#dbeafe" font-family="Arial, sans-serif" font-size="26">Khám phá · Thực hành · Học tập</text>
</svg>`;

  await fs.promises.writeFile(path.join(directory, filename), svg, "utf8");
  return getCourseMediaUrl(req, userId, filename);
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
