import type { NextFunction, Request, Response } from "express";
import type { Material as PrismaMaterial } from "@prisma/client";
import { unlink } from "node:fs/promises";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import {
  getCourseMediaUrl,
  isValidGlbFile,
} from "../../utils/course-media.js";
import { z } from "zod";

const materialInputSchema = z.object({
  title: z.string().trim().min(2).max(150),
  type: z.enum(["PDF", "DOCUMENT", "MODEL_3D", "OTHER"]),
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
  if (lesson.course.createdById !== req.user.id) {
    throw new AppError("You can only upload content to your own courses", 403);
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
  if (!req.file) throw new AppError("Choose a file to upload", 400);
  const parsedInput = materialInputSchema.safeParse(req.body);
  if (!parsedInput.success) {
    await unlink(req.file.path);
    throw new AppError("The material details are invalid", 400);
  }
  const input = parsedInput.data;
  if (input.type === "MODEL_3D") {
    let validGlb: boolean;
    try {
      validGlb = await isValidGlbFile(req.file.path);
    } catch (error) {
      await unlink(req.file.path);
      throw error;
    }
    if (!validGlb) {
      await unlink(req.file.path);
      throw new AppError("The uploaded file is not a valid GLB 2.0 model", 400);
    }
  }
  if (
    input.type !== "MODEL_3D" &&
    req.file.originalname.toLowerCase().endsWith(".glb")
  ) {
    await unlink(req.file.path);
    throw new AppError("GLB files must be uploaded as a 3D model", 400);
  }
  const url = getCourseMediaUrl(req, req.user.id, req.file.filename);
  let material: PrismaMaterial;
  try {
    material = await prisma.material.create({
      data: {
        title: input.title,
        type: input.type,
        url,
        lessonId: String(req.params.lessonId),
      },
    });
  } catch (error) {
    await unlink(req.file.path);
    throw error;
  }
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
