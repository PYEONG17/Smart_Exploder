import { z } from "zod";

export const videoHeartbeatSchema = z.object({
  clientEventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  positionMs: z.number().int().nonnegative().max(86_400_000),
  occurredAt: z.string().datetime({ offset: true }),
});

export const labHeartbeatSchema = videoHeartbeatSchema;

export const analyticsPeriodSchema = z.enum(["7d", "30d", "90d", "100d", "200d", "500d"]);
