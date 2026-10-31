import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import {
  analyticsPeriodSchema,
  labHeartbeatSchema,
  videoHeartbeatSchema,
} from "./schema.js";

type VideoHeartbeatInput = z.infer<typeof videoHeartbeatSchema>;
type LabHeartbeatInput = z.infer<typeof labHeartbeatSchema>;
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
const MAX_LAB_HEARTBEAT_GAP_MS = 30_000;
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

  async recordLabHeartbeat(
    userId: string,
    tenantId: string | undefined,
    labId: string,
    input: LabHeartbeatInput,
  ) {
    const lab = await prisma.customLab.findUnique({
      where: { id: labId },
      select: { id: true },
    });
    if (!lab) throw new AppError("Lab not found", 404);

    const occurredAt = new Date(input.occurredAt);
    const now = Date.now();
    if (Math.abs(now - occurredAt.getTime()) > MAX_LAB_HEARTBEAT_GAP_MS * 3) {
      throw new AppError("Lab study heartbeat timestamp is outside the allowed window", 400);
    }

    const priorRows = await prisma.$queryRaw<
      { position_ms: number; client_occurred_at: Date }[]
    >`
      SELECT "position_ms", "client_occurred_at"
      FROM "lab_study_events"
      WHERE "user_id" = ${userId}
        AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
        AND "lab_id" = ${labId}
        AND "session_id" = ${input.sessionId}
      ORDER BY "client_occurred_at" DESC, "created_at" DESC
      LIMIT 1
    `;
    const prior = priorRows[0];

    let studiedMs = 0;
    if (prior && occurredAt > prior.client_occurred_at) {
      const elapsedMs = occurredAt.getTime() - prior.client_occurred_at.getTime();
      const positionDeltaMs = input.positionMs - prior.position_ms;
      if (
        elapsedMs <= MAX_LAB_HEARTBEAT_GAP_MS &&
        positionDeltaMs > 0 &&
        positionDeltaMs <= elapsedMs * 1.5
      ) {
        studiedMs = Math.min(elapsedMs, positionDeltaMs);
      }
    }

    const inserted = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "lab_study_events" (
        "id", "client_event_id", "session_id", "position_ms", "studied_ms",
        "client_occurred_at", "user_id", "lab_id", "tenant_id"
      )
      VALUES (
        ${randomUUID()}, ${input.clientEventId}, ${input.sessionId},
        ${input.positionMs}, ${Math.floor(studiedMs)}, ${occurredAt},
        ${userId}, ${labId}, ${tenantId ?? null}::uuid
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
      dailyLab,
      labSessionCount,
      labCount,
      labActivity,
      videoCount,
      videoActivity,
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
      prisma.$queryRaw<
        { day: string; studied_ms: bigint; active_sessions: bigint }[]
      >`
        SELECT
          to_char(date_trunc('day', "created_at" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
          COALESCE(SUM("studied_ms"), 0)::bigint AS studied_ms,
          COUNT(DISTINCT "session_id") FILTER (WHERE "studied_ms" > 0)::bigint AS active_sessions
        FROM "lab_study_events"
        WHERE "user_id" = ${userId}
          AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND "created_at" >= ${since}
        GROUP BY date_trunc('day', "created_at" AT TIME ZONE 'UTC')
        ORDER BY date_trunc('day', "created_at" AT TIME ZONE 'UTC')
      `,
      prisma.$queryRaw<{ active_sessions: bigint }[]>`
        SELECT COUNT(DISTINCT "session_id")::bigint AS active_sessions
        FROM "lab_study_events"
        WHERE "user_id" = ${userId}
          AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND "created_at" >= ${since}
          AND "studied_ms" > 0
      `,
      prisma.$queryRaw<{ lab_count: bigint }[]>`
        SELECT COUNT(DISTINCT "lab_id")::bigint AS lab_count
        FROM "lab_study_events"
        WHERE "user_id" = ${userId}
          AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND "created_at" >= ${since}
          AND "studied_ms" > 0
      `,
      prisma.$queryRaw<
        {
          id: string;
          title: string;
          title_en: string;
          subject: string;
          grade: string;
          studied_ms: bigint;
          sessions: bigint;
          last_studied_at: Date;
        }[]
      >`
        SELECT
          lab."id",
          lab."title",
          lab."titleEn" AS title_en,
          lab."subject",
          lab."grade",
          SUM(study."studied_ms")::bigint AS studied_ms,
          COUNT(DISTINCT study."session_id")::bigint AS sessions,
          MAX(study."created_at") AS last_studied_at
        FROM "lab_study_events" study
        JOIN "CustomLab" lab ON lab."id" = study."lab_id"
        WHERE study."user_id" = ${userId}
          AND study."tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND study."created_at" >= ${since}
          AND study."studied_ms" > 0
        GROUP BY lab."id", lab."title", lab."titleEn", lab."subject", lab."grade"
        ORDER BY MAX(study."created_at") DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ video_count: bigint }[]>`
        SELECT COUNT(DISTINCT "video_id")::bigint AS video_count
        FROM "video_watch_events"
        WHERE "user_id" = ${userId}
          AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND "created_at" >= ${since}
          AND "watched_ms" > 0
      `,
      prisma.$queryRaw<
        {
          id: string;
          title: string;
          title_en: string | null;
          lesson_title: string;
          lesson_title_en: string | null;
          watched_ms: bigint;
          last_watched_at: Date;
        }[]
      >`
        SELECT
          video."id",
          video."title",
          video."titleEn" AS title_en,
          lesson."title" AS lesson_title,
          lesson."titleEn" AS lesson_title_en,
          SUM(event."watched_ms")::bigint AS watched_ms,
          MAX(event."created_at") AS last_watched_at
        FROM "video_watch_events" event
        JOIN "Video" video ON video."id" = event."video_id"
        JOIN "Lesson" lesson ON lesson."id" = video."lessonId"
        WHERE event."user_id" = ${userId}
          AND event."tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
          AND event."created_at" >= ${since}
          AND event."watched_ms" > 0
        GROUP BY video."id", video."title", video."titleEn", lesson."title", lesson."titleEn"
        ORDER BY MAX(event."created_at") DESC
        LIMIT 10
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
          UNION
          SELECT DISTINCT date_trunc('day', "created_at" AT TIME ZONE 'UTC') AS activity_day
          FROM "lab_study_events"
          WHERE "user_id" = ${userId}
            AND "tenant_id" IS NOT DISTINCT FROM ${tenantId ?? null}::uuid
            AND "created_at" >= ${since}
            AND "studied_ms" > 0
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
      const labEntry = dailyLab.find((entry) => entry.day === day);
      return {
        date: day,
        watchSeconds: existing
          ? Math.floor(Number(existing.watched_ms) / 1000)
          : 0,
        activeSessions: existing ? Number(existing.active_sessions) : 0,
        labStudySeconds: labEntry
          ? Math.floor(Number(labEntry.studied_ms) / 1000)
          : 0,
        activeLabSessions: labEntry ? Number(labEntry.active_sessions) : 0,
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
      ...dailyLab
        .filter((day) => Number(day.studied_ms) > 0)
        .map((day) => day.day),
      ...activityDays.map((day) => day.day),
    ]);
    const activeDays = days.filter(
      (day) => learningDayKeys.has(day.date),
    ).length;
    const activeSessions = Number(watchSessionCount[0]?.active_sessions ?? 0);
    const labStudySeconds = Math.floor(
      dailyLab.reduce((total, entry) => total + Number(entry.studied_ms), 0) / 1000,
    );
    const labSessions = Number(labSessionCount[0]?.active_sessions ?? 0);
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
        labStudySeconds,
        totalStudySeconds: totalWatchSeconds + labStudySeconds,
        activeDays,
        activeSessions,
        videosWatched: Number(videoCount[0]?.video_count ?? 0),
        labsStudied: Number(labCount[0]?.lab_count ?? 0),
        labSessions,
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
      videos: videoActivity.map((video) => ({
        id: video.id,
        title: video.title,
        titleEn: video.title_en,
        lessonTitle: video.lesson_title,
        lessonTitleEn: video.lesson_title_en,
        watchedSeconds: Math.floor(Number(video.watched_ms) / 1000),
        lastWatchedAt: video.last_watched_at.toISOString(),
      })),
      labs: labActivity.map((lab) => ({
        id: lab.id,
        title: lab.title,
        titleEn: lab.title_en,
        subject: lab.subject,
        grade: lab.grade,
        studiedSeconds: Math.floor(Number(lab.studied_ms) / 1000),
        sessions: Number(lab.sessions),
        lastStudiedAt: lab.last_studied_at.toISOString(),
      })),
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
