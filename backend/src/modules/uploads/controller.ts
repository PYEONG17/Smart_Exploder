import type { NextFunction, Request, Response } from "express";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { getCourseMediaUrl } from "../../utils/course-media.js";
import { z } from "zod";

const materialInputSchema = z.object({
  title: z.string().trim().min(2).max(150),
  type: z.enum(["PDF", "DOCUMENT", "OTHER"]),
});
const materialLinkInputSchema = z.object({
  title: z.string().trim().min(2).max(150),
  type: z.enum(["PDF", "DOCUMENT", "MODEL_3D", "OTHER"]),
  url: z.string().trim().url().max(2000),
});

export async function authorizeLessonVideoUpload(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const lesson = await prisma.lesson.findUnique({
    where: { id: String(req.params.lessonId) },
    select: { course: { select: { createdById: true } } },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);
  if (req.user.role !== "ADMIN" && lesson.course.createdById !== req.user.id) {
    throw new AppError("You can only upload video to your own courses", 403);
  }
  next();
}

export function uploadCourseThumbnail(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("Choose an image to upload", 400);
  const url = getCourseMediaUrl(req, req.user.id, req.file.filename);
  res.status(201).json(success({ url }, "Course thumbnail uploaded"));
}

export function uploadLessonVideo(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("Choose a video to upload", 400);
  const url = getCourseMediaUrl(req, req.user.id, req.file.filename);
  res.status(201).json(success({ url }, "Lesson video uploaded"));
}

export async function uploadLessonMaterial(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("Choose a document to upload", 400);
  const input = materialInputSchema.parse(req.body);
  const url = getCourseMediaUrl(req, req.user.id, req.file.filename);
  const material = await prisma.material.create({
    data: {
      title: input.title,
      type: input.type,
      url,
      lessonId: String(req.params.lessonId),
    },
  });
  res.status(201).json(success(material, "Lesson material uploaded"));
}

export async function createLessonMaterialLink(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const input = materialLinkInputSchema.parse(req.body);
  const material = await prisma.material.create({
    data: {
      title: input.title,
      type: input.type,
      url: input.url,
      lessonId: String(req.params.lessonId),
    },
  });
  res.status(201).json(success(material, "Lesson material link saved"));
}
