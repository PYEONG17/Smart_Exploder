import type { Request, Response } from "express";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { removeCourseMediaByUrls } from "../../utils/course-media.js";
import { toBilingualList } from "../ai/translate.js";
import { videoActivitySchema, type VideoActivityInput } from "../learning/schema.js";

type OwnedLesson = { course: { createdById: string | null } };

function assertCanManage(req: Request, lesson: OwnedLesson | null) {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!lesson) throw new AppError("Content not found", 404);
  if (req.user.role !== "ADMIN" && lesson.course.createdById !== req.user.id) {
    throw new AppError("You can only manage content in your own courses", 403);
  }
}

const lessonOwner = { select: { course: { select: { createdById: true } } } };

export async function deleteVideo(req: Request, res: Response) {
  const id = String(req.params.id);
  const video = await prisma.video.findUnique({
    where: { id },
    select: { url: true, lesson: lessonOwner },
  });
  assertCanManage(req, video?.lesson ?? null);
  await prisma.video.delete({ where: { id } });
  await removeCourseMediaByUrls([video?.url]);
  res.json(success({ id }, "Video deleted"));
}

export async function deleteQuiz(req: Request, res: Response) {
  const id = String(req.params.id);
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { lesson: lessonOwner },
  });
  assertCanManage(req, quiz?.lesson ?? null);
  await prisma.quiz.delete({ where: { id } });
  res.json(success({ id }, "Quiz deleted"));
}

export async function deleteMaterial(req: Request, res: Response) {
  const id = String(req.params.id);
  const material = await prisma.material.findUnique({
    where: { id },
    select: { url: true, lesson: lessonOwner },
  });
  assertCanManage(req, material?.lesson ?? null);
  await prisma.material.delete({ where: { id } });
  await removeCourseMediaByUrls([material?.url]);
  res.json(success({ id }, "Material deleted"));
}

const MAX_ACTIVITIES_PER_VIDEO = 20;
const YOUTUBE_HOSTS = ["youtube.com", "m.youtube.com", "youtu.be"];

function isYouTubeUrl(url: string) {
  try {
    return YOUTUBE_HOSTS.includes(new URL(url).hostname.replace(/^www\./, ""));
  } catch {
    return false;
  }
}

function timestampMsOf(input: VideoActivityInput) {
  return input.timestampMs ?? (input.timestamp ?? 0) * 1000;
}

// Multiple-choice checkpoints are typed in one language; the other side is translated.
async function prepareContent(input: VideoActivityInput) {
  if (
    (input.type !== "QUESTION" && input.type !== "QUIZ") ||
    !input.sourceLanguage
  ) {
    return input.content;
  }
  const { question, options, explanation } = input.content;
  const translated = await toBilingualList(
    [question, ...options, explanation ?? ""],
    input.sourceLanguage,
  );
  const optionCount = options.length;
  const questionText = translated[0];
  const optionTexts = translated.slice(1, 1 + optionCount);
  const explanationText = translated[1 + optionCount];
  return {
    ...input.content,
    question: questionText.vi,
    questionEn: questionText.en,
    options: optionTexts.map((item) => item.vi),
    optionsEn: optionTexts.map((item) => item.en),
    ...(explanation
      ? { explanation: explanationText.vi, explanationEn: explanationText.en }
      : { explanation: undefined, explanationEn: undefined }),
  };
}

async function loadManagedVideo(req: Request) {
  const id = String(req.params.id);
  const video = await prisma.video.findUnique({
    where: { id },
    select: { id: true, url: true, lesson: lessonOwner },
  });
  assertCanManage(req, video?.lesson ?? null);
  return video as NonNullable<typeof video>;
}

function parseContent(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function serializeActivity(activity: {
  id: string;
  type: string;
  timestamp: number;
  timestampMs: number | null;
  content: string;
}) {
  return {
    id: activity.id,
    type: activity.type,
    timestampMs: activity.timestampMs ?? activity.timestamp * 1000,
    content: parseContent(activity.content),
  };
}

export async function listVideoActivities(req: Request, res: Response) {
  const video = await loadManagedVideo(req);
  const activities = await prisma.interactiveActivity.findMany({
    where: { videoId: video.id },
    orderBy: [{ timestampMs: "asc" }, { timestamp: "asc" }],
  });
  res.json(success(activities.map(serializeActivity)));
}

async function assertTimestampAvailable(
  videoId: string,
  timestampMs: number,
  excludeId?: string,
) {
  const clash = await prisma.interactiveActivity.findFirst({
    where: {
      videoId,
      timestampMs,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (clash) {
    throw new AppError("Another checkpoint already uses this timestamp", 409);
  }
}

export async function createVideoActivity(req: Request, res: Response) {
  const video = await loadManagedVideo(req);
  if (isYouTubeUrl(video.url)) {
    throw new AppError(
      "Interactive checkpoints require an uploaded or direct video file",
      400,
    );
  }
  const input = videoActivitySchema.parse(req.body);
  const timestampMs = timestampMsOf(input);
  const count = await prisma.interactiveActivity.count({
    where: { videoId: video.id },
  });
  if (count >= MAX_ACTIVITIES_PER_VIDEO) {
    throw new AppError("Each video supports at most 20 activities", 400);
  }
  await assertTimestampAvailable(video.id, timestampMs);
  const content = await prepareContent(input);
  const activity = await prisma.interactiveActivity.create({
    data: {
      videoId: video.id,
      type: input.type,
      timestamp: Math.floor(timestampMs / 1000),
      timestampMs,
      content: JSON.stringify(content),
    },
  });
  res.status(201).json(success(serializeActivity(activity), "Checkpoint created"));
}

async function loadManagedActivity(req: Request) {
  const id = String(req.params.id);
  const activity = await prisma.interactiveActivity.findUnique({
    where: { id },
    select: { id: true, videoId: true, video: { select: { lesson: lessonOwner } } },
  });
  assertCanManage(req, activity?.video.lesson ?? null);
  return activity as NonNullable<typeof activity>;
}

export async function updateVideoActivity(req: Request, res: Response) {
  const existing = await loadManagedActivity(req);
  const input = videoActivitySchema.parse(req.body);
  const timestampMs = timestampMsOf(input);
  await assertTimestampAvailable(existing.videoId, timestampMs, existing.id);
  const content = await prepareContent(input);
  const activity = await prisma.interactiveActivity.update({
    where: { id: existing.id },
    data: {
      type: input.type,
      timestamp: Math.floor(timestampMs / 1000),
      timestampMs,
      content: JSON.stringify(content),
    },
  });
  res.json(success(serializeActivity(activity), "Checkpoint updated"));
}

export async function deleteVideoActivity(req: Request, res: Response) {
  const existing = await loadManagedActivity(req);
  await prisma.interactiveActivity.delete({ where: { id: existing.id } });
  res.json(success({ id: existing.id }, "Checkpoint deleted"));
}
