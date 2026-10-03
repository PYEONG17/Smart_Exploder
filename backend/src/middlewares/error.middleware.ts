import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { failure } from "../utils/api-response.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the allowed size limit"
        : "Invalid media upload";
    return res.status(statusCode).json(failure(message));
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(failure(err.message, err.errors));
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json(failure("Validation failed", errors));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json(failure("A record with this value already exists"));
  }

  console.error(err);
  return res.status(500).json(failure("Something went wrong"));
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json(failure("Route not found"));
}
