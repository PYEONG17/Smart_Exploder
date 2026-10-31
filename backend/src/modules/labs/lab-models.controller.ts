import type { Request, Response } from "express";
import { unlink } from "node:fs/promises";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import {
  getCourseMediaUrl,
  isValidGlbFile,
  removeCourseMediaByUrls,
} from "../../utils/course-media.js";

const experimentIdPattern = /^[a-z0-9_]{2,80}$/;

export async function listLabModels(_req: Request, res: Response) {
  const models = await prisma.labModel.findMany({
    select: {
      id: true,
      experimentId: true,
      title: true,
      url: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  res.status(200).json(success(models));
}

export async function saveLabModel(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("Choose a GLB model to upload", 400);

  const experimentId = String(req.params.experimentId);
  const title =
    typeof req.body.title === "string" ? req.body.title.trim() : "";
  if (
    !experimentIdPattern.test(experimentId) ||
    title.length < 2 ||
    title.length > 150
  ) {
    await unlink(req.file.path);
    throw new AppError("The lab model details are invalid", 400);
  }
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

  let existing: {
    id: string;
    url: string;
    uploadedById: string;
  } | null;
  try {
    existing = await prisma.labModel.findUnique({
      where: { experimentId },
      select: { id: true, url: true, uploadedById: true },
    });
  } catch (error) {
    await unlink(req.file.path);
    throw error;
  }
  if (
    existing &&
    existing.uploadedById !== req.user.id
  ) {
    await unlink(req.file.path);
    throw new AppError("Only the uploader can replace this model", 403);
  }

  const url = getCourseMediaUrl(req, req.user.id, req.file.filename);
  let model: {
    id: string;
    experimentId: string;
    title: string;
    url: string;
    updatedAt: Date;
  };
  try {
    model = existing
      ? await prisma.labModel.update({
          where: { experimentId },
          data: { title, url, uploadedById: req.user.id },
          select: {
            id: true,
            experimentId: true,
            title: true,
            url: true,
            updatedAt: true,
          },
        })
      : await prisma.labModel.create({
          data: { experimentId, title, url, uploadedById: req.user.id },
          select: {
            id: true,
            experimentId: true,
            title: true,
            url: true,
            updatedAt: true,
          },
        });
  } catch (error) {
    await unlink(req.file.path);
    throw error;
  }

  if (existing) await removeCourseMediaByUrls([existing.url]);
  res.status(existing ? 200 : 201).json(success(model, "Lab model saved"));
}
