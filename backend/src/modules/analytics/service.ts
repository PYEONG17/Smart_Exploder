import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { analyticsPeriodSchema, videoHeartbeatSchema } from "./schema.js";

type VideoHeartbeatInput = z.infer<typeof videoHeartbeatSchema>;
type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;

const periodDays: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "100d": 100,
  "200d": 200,
  "500d": 500,
};
const MAX_HEARTBEAT_GAP_MS = 30_000;
const MAX_PLAYBACK_RATE = 2.5;
const ENGAGEMENT_TARGETS = {
  activeDays: { points: 40, target: 5 },
  watchSeconds: { points: 30, target: 3_600 },
  activeSessions: { points: 20, target: 5 },
  quizAttempts: { points: 10, target: 3 },
} as const;

export const analyticsService = {
  async recordVideoHeartbeat(
    userId: string,
    tenantId: string | undefined,
    videoId: string,
    input: VideoHeartbeatInput,
  ) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    });
    if (!video) throw new AppError("Video not found", 404);

    const occurredAt = new Date(input.occurredAt);
    const now = Date.now();
    if (Math.abs(now - occurredAt.getTime()) > MAX_HEARTBEAT_GAP_MS * 3) {
      throw new AppError("Playback heartbeat timestamp is outside the allowed window", 400);
    }

    const priorRows = await prisma.$queryRaw<
      { position_ms: number; client_occurred_at: Date }[]
    >`
      SELECT "position_ms", "client_occurred_at"
      FROM "video_watch_events"
      WHERE "user_id" = ${userId}
        AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
        AND "video_id" = ${videoId}
        AND "session_id" = ${input.sessionId}
      ORDER BY "client_occurred_at" DESC, "created_at" DESC
      LIMIT 1
    `;
    const prior = priorRows[0];

    let watchedMs = 0;
    if (prior && occurredAt > prior.client_occurred_at) {
      const elapsedMs =
        occurredAt.getTime() - prior.client_occurred_at.getTime();
      const playbackDeltaMs = input.positionMs - prior.position_ms;
      if (
        elapsedMs <= MAX_HEARTBEAT_GAP_MS &&
        playbackDeltaMs > 0 &&
        playbackDeltaMs <= elapsedMs * MAX_PLAYBACK_RATE
      ) {
        watchedMs = Math.min(elapsedMs, playbackDeltaMs * 2);
      }
    }

    const inserted = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "video_watch_events" (
        "id", "client_event_id", "session_id", "position_ms", "watched_ms",
        "client_occurred_at", "user_id", "video_id", "tenant_id"
      )
      VALUES (
        ${randomUUID()}, ${input.clientEventId}, ${input.sessionId},
        ${input.positionMs}, ${Math.floor(watchedMs)}, ${occurredAt},
        ${userId}, ${videoId}, ${tenantId ?? null}::uuid
      )
      ON CONFLICT ("client_event_id") DO NOTHING
      RETURNING "id"
    `;

    return { accepted: true, duplicate: inserted.length === 0 };
  },

  async getMySummary(
    userId: string,
    tenantId: string | undefined,
    period: AnalyticsPeriod,
  ) {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (periodDays[period] - 1));
    const [
      dailyWatch,
      watchSessionCount,
      activityDays,
      progress,
      quizSummary,
    ] = await Promise.all([
      prisma.$queryRaw<
        { day: string; watched_ms: bigint; active_sessions: bigint }[]
      >`
        SELECT
          to_char(date_trunc('day', "created_at" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
          COALESCE(SUM("watched_ms"), 0)::bigint AS watched_ms,
          COUNT(DISTINCT "session_id") FILTER (WHERE "watched_ms" > 0)::bigint AS active_sessions
        FROM "video_watch_events"
        WHERE "user_id" = ${userId}
          AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND "created_at" >= ${since}
        GROUP BY date_trunc('day', "created_at" AT TIME ZONE 'UTC')
        ORDER BY date_trunc('day', "created_at" AT TIME ZONE 'UTC')
      `,
      prisma.$queryRaw<{ active_sessions: bigint }[]>`
        SELECT COUNT(DISTINCT "session_id")::bigint AS active_sessions
        FROM "video_watch_events"
        WHERE "user_id" = ${userId}
          AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND "created_at" >= ${since}
          AND "watched_ms" > 0
      `,
      prisma.$queryRaw<{ day: string }[]>`
        SELECT to_char(activity_day, 'YYYY-MM-DD') AS day
        FROM (
          SELECT DISTINCT date_trunc('day', "updatedAt" AT TIME ZONE 'UTC') AS activity_day
          FROM "Progress"
          WHERE "userId" = ${userId} AND "updatedAt" >= ${since}
          UNION
          SELECT DISTINCT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS activity_day
          FROM "QuizAttempt"
          WHERE "userId" = ${userId} AND "createdAt" >= ${since}
        ) AS learning_days
      `,
      prisma.progress.groupBy({
        by: ["status"],
        where: { userId, updatedAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.quizAttempt.aggregate({
        where: { userId, createdAt: { gte: since } },
        _avg: { percentage: true },
        _count: { _all: true },
      }),
    ]);

    const days = Array.from({ length: periodDays[period] }, (_, index) => {
      const date = new Date(since);
      date.setUTCDate(date.getUTCDate() + index);
      const day = date.toISOString().slice(0, 10);
      const existing = dailyWatch.find((entry) => entry.day === day);
      return {
        date: day,
        watchSeconds: existing
          ? Math.floor(Number(existing.watched_ms) / 1000)
          : 0,
        activeSessions: existing ? Number(existing.active_sessions) : 0,
      };
    });

    const totalProgress = progress.reduce(
      (total, item) => total + item._count._all,
      0,
    );
    const completedProgress =
      progress.find((item) => item.status === "COMPLETED")?._count._all ?? 0;
    const totalWatchSeconds = days.reduce(
      (total, day) => total + day.watchSeconds,
      0,
    );
    const learningDayKeys = new Set([
      ...dailyWatch
        .filter((day) => Number(day.watched_ms) > 0)
        .map((day) => day.day),
      ...activityDays.map((day) => day.day),
    ]);
    const activeDays = days.filter(
      (day) => learningDayKeys.has(day.date),
    ).length;
    const activeSessions = Number(watchSessionCount[0]?.active_sessions ?? 0);
    const quizAttempts = quizSummary._count._all;
    const targetScale = periodDays[period] / 7;
    const engagementComponents = [
      {
        key: "activeDays",
        value: activeDays,
        points: ENGAGEMENT_TARGETS.activeDays.points,
        target: Math.ceil(ENGAGEMENT_TARGETS.activeDays.target * targetScale),
      },
      {
        key: "watchSeconds",
        value: totalWatchSeconds,
        points: ENGAGEMENT_TARGETS.watchSeconds.points,
        target: Math.ceil(ENGAGEMENT_TARGETS.watchSeconds.target * targetScale),
      },
      {
        key: "activeSessions",
        value: activeSessions,
        points: ENGAGEMENT_TARGETS.activeSessions.points,
        target: Math.ceil(ENGAGEMENT_TARGETS.activeSessions.target * targetScale),
      },
      {
        key: "quizAttempts",
        value: quizAttempts,
        points: ENGAGEMENT_TARGETS.quizAttempts.points,
        target: Math.ceil(ENGAGEMENT_TARGETS.quizAttempts.target * targetScale),
      },
    ].map((component) => ({
      ...component,
      earnedPoints: Math.round(
        Math.min(component.value / component.target, 1) * component.points,
      ),
    }));
    const engagementScore = engagementComponents.reduce(
      (total, component) => total + component.earnedPoints,
      0,
    );

    return {
      period,
      metrics: {
        watchSeconds: totalWatchSeconds,
        activeDays,
        activeSessions,
        quizAttempts,
        averageQuizPercentage:
          quizSummary._avg.percentage == null
            ? null
            : Math.round(quizSummary._avg.percentage),
        engagementScore,
        engagementComponents,
        lessonsCompleted: completedProgress,
        lessonsTracked: totalProgress,
        completionRate: totalProgress
          ? Math.round((completedProgress / totalProgress) * 100)
          : null,
      },
      daily: days,
      topicMastery: {
        available: false,
        reason: "Learning content is not tagged with a shared topic taxonomy yet.",
      },
      riskSignals: {
        available: false,
        reason: "Risk signals require a defined instructional schedule and sufficient learning history.",
      },
    };
  },
};
