import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { analyticsPeriodSchema, videoHeartbeatSchema } from "./schema.js";
import { analyticsService } from "./service.js";

function currentUser(req: Request) {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user;
}

export async function recordVideoHeartbeat(req: Request, res: Response) {
  const parsed = videoHeartbeatSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Invalid video playback event", 400);
  }
  const user = currentUser(req);
  const result = await analyticsService.recordVideoHeartbeat(
    user.id,
    user.tenantId,
    String(req.params.videoId),
    parsed.data,
  );
  res.status(202).json(success(result, "Playback event recorded"));
}

export async function getMyLearningSummary(req: Request, res: Response) {
  const parsedPeriod = analyticsPeriodSchema.safeParse(req.query.period ?? "7d");
  if (!parsedPeriod.success) {
    throw new AppError("Period must be 7d, 30d, or 90d", 400);
  }
  const user = currentUser(req);
  const summary = await analyticsService.getMySummary(
    user.id,
    user.tenantId,
    parsedPeriod.data,
  );
  res.json(success(summary));
}
