import type { Request, Response } from "express";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { z } from "zod";
import { toBilingualText } from "../ai/translate.js";
import { removeCourseMediaByUrls } from "../../utils/course-media.js";
import type { ActivityType } from "@prisma/client";

const createLessonSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(150),
  titleEn: z.string().trim().max(150).optional(),
  description: z.string().trim().max(5000).optional(),
  descEn: z.string().trim().max(5000).optional(),
  order: z.number().int().positive(),
  duration: z.string().trim().max(50).optional(),
  sourceLanguage: z.enum(["vi", "en"]).optional(),
});

function toStudentActivityContent(type: ActivityType, value: string) {
  let content: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Activity content must be a JSON object");
    }
    content = parsed as Record<string, unknown>;
  } catch {
    throw new AppError("Video event content is invalid", 500);
  }

  const stringField = (key: string) =>
    typeof content[key] === "string" ? content[key] : undefined;
  const objectArray = (key: string, hiddenKeys: string[] = []) =>
    Array.isArray(content[key])
      ? content[key].map((item: unknown) => {
          if (typeof item === "string") return item;
          if (typeof item !== "object" || item === null || Array.isArray(item)) {
            return {};
          }
          return Object.fromEntries(
            Object.entries(item).filter(([field]) => !hiddenKeys.includes(field)),
          );
        })
      : [];
  const optionalString = (key: string) => {
    const field = stringField(key);
    return field === undefined ? {} : { [key]: field };
  };
  const optionalNumber = (key: string) =>
    typeof content[key] === "number" ? { [key]: content[key] } : {};
  const retryPolicy = {
    ...optionalNumber("rewindSeconds"),
    ...optionalNumber("skipAfterAttempts"),
  };

  switch (type) {
    case "QUESTION":
    case "QUIZ":
      return {
        ...optionalString("question"),
        ...optionalString("questionEn"),
        options: objectArray("options"),
        optionsEn: objectArray("optionsEn"),
        ...optionalString("explanation"),
        ...optionalString("explanationEn"),
        ...retryPolicy,
      };
    case "EXPLANATION":
      return {
        ...optionalString("text"),
        ...optionalString("textEn"),
      };
    case "DRAG_DROP":
      return {
        ...optionalString("prompt"),
        items: objectArray("items", ["targetZoneId"]),
        zones: objectArray("zones"),
        ...optionalString("explanation"),
        ...optionalString("explanationEn"),
        ...retryPolicy,
      };
    case "MATCHING":
      return {
        ...optionalString("prompt"),
        leftItems: objectArray("leftItems"),
        rightItems: objectArray("rightItems"),
        ...optionalString("explanation"),
        ...optionalString("explanationEn"),
        ...retryPolicy,
      };
    case "FILL_BLANK":
      return {
        ...optionalString("prompt"),
        blanks: objectArray("blanks", ["acceptedAnswers"]),
        ...optionalString("explanation"),
        ...optionalString("explanationEn"),
        ...retryPolicy,
      };
    case "POLL":
      return {
        ...optionalString("prompt"),
        options: objectArray("options"),
        allowMultiple: content.allowMultiple === true,
      };
    case "REFLECTION":
      return {
        ...optionalString("prompt"),
        minLength:
          typeof content.minLength === "number" ? content.minLength : 0,
        maxLength:
          typeof content.maxLength === "number" ? content.maxLength : 1000,
        ...optionalString("dataNotice"),
        ...optionalString("dataNoticeEn"),
      };
    case "VOCABULARY":
      return {
        ...optionalString("term"),
        ...optionalString("termEn"),
        ...optionalString("pronunciation"),
        ...optionalString("definition"),
        ...optionalString("definitionEn"),
        ...optionalString("example"),
        ...optionalString("exampleEn"),
      };
    case "AI_EXPLANATION":
      return {
        ...optionalString("prompt"),
        ...optionalString("promptEn"),
        ...optionalString("context"),
        ...optionalString("contextEn"),
      };
    default:
      throw new AppError("Unsupported video event type", 500);
  }
}

export const createLesson = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { sourceLanguage, ...input } = createLessonSchema.parse(req.body);
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
    select: { id: true, createdById: true },
  });
  if (!course) throw new AppError("Course not found", 404);
  if (req.user.role !== "ADMIN" && course.createdById !== req.user.id) {
    throw new AppError("You can only add lessons to your own courses", 403);
  }

  if (sourceLanguage) {
    const title = await toBilingualText(input.title, sourceLanguage);
    input.title = title.vi;
    input.titleEn = title.en;
    if (input.description) {
      const description = await toBilingualText(input.description, sourceLanguage);
      input.description = description.vi;
      input.descEn = description.en;
    }
  }

  const lesson = await prisma.lesson.create({ data: input });
  res.status(201).json(success(lesson, "Lesson created"));
};

async function getManagedLessonForRequest(req: Request) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const lesson = await prisma.lesson.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true,
      course: { select: { createdById: true } },
      videos: { select: { url: true } },
      materials: { select: { url: true } },
    },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);
  if (req.user.role !== "ADMIN" && lesson.course.createdById !== req.user.id) {
    throw new AppError("You can only manage lessons in your own courses", 403);
  }
  return lesson;
}

const updateLessonSchema = createLessonSchema
  .omit({ courseId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const updateLesson = async (req: Request, res: Response) => {
  const lesson = await getManagedLessonForRequest(req);
  const { sourceLanguage, ...input } = updateLessonSchema.parse(req.body);
  const data = { ...input };
  if (sourceLanguage) {
    if (input.title) {
      const title = await toBilingualText(input.title, sourceLanguage);
      data.title = title.vi;
      data.titleEn = title.en;
    }
    if (input.description) {
      const description = await toBilingualText(input.description, sourceLanguage);
      data.description = description.vi;
      data.descEn = description.en;
    }
  }
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data });
  res.json(success(updated, "Lesson updated"));
};

const reorderVideosSchema = z.object({
  videoIds: z.array(z.string().uuid()).min(1).max(100),
});

function assertSameIds(requested: string[], existing: string[], label: string) {
  const expected = new Set(existing);
  if (
    new Set(requested).size !== requested.length ||
    requested.length !== expected.size ||
    requested.some((id) => !expected.has(id))
  ) {
    throw new AppError(`The ${label} list is out of date. Reload and try again.`, 409);
  }
}

export const reorderLessonVideos = async (req: Request, res: Response) => {
  const lesson = await getManagedLessonForRequest(req);
  const { videoIds } = reorderVideosSchema.parse(req.body);
  const videos = await prisma.video.findMany({
    where: { lessonId: lesson.id },
    select: { id: true },
  });
  assertSameIds(videoIds, videos.map((video) => video.id), "video");
  await prisma.$transaction(
    videoIds.map((id, index) =>
      prisma.video.update({ where: { id }, data: { order: index + 1 } }),
    ),
  );
  res.json(success({ videoIds }, "Video order updated"));
};

export const deleteLesson = async (req: Request, res: Response) => {
  const lesson = await getManagedLessonForRequest(req);
  await prisma.lesson.delete({ where: { id: lesson.id } });
  await removeCourseMediaByUrls([
    ...lesson.videos.map((video) => video.url),
    ...lesson.materials.map((material) => material.url),
  ]);
  res.json(success({ id: lesson.id }, "Lesson deleted"));
};

export const getLessonById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        materials: true,
        videos: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          include: {
            activities: { orderBy: [{ timestampMs: "asc" }, { timestamp: "asc" }] },
          },
        },
        quizzes: {
          include: {
            questions: {
              include: {
                answers: {
                  select: { id: true, content: true, contentEn: true },
                },
              },
            },
          },
        },
        course: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    res.json({
      success: true,
      data: {
        ...lesson,
        videos: lesson.videos.map((video) => ({
          ...video,
          activities: video.activities.map((activity) => ({
            ...activity,
              timestampMs: activity.timestampMs ?? activity.timestamp * 1000,
              content: toStudentActivityContent(activity.type, activity.content),
          })),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
