import type { Request, Response } from "express";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { z } from "zod";
import { toBilingualText } from "../ai/translate.js";
import { removeCourseMediaByUrls } from "../../utils/course-media.js";

const courseSchema = z.object({
  title: z.string().trim().min(2).max(150),
  titleEn: z.string().trim().max(150).optional(),
  description: z.string().trim().max(5000).optional(),
  descEn: z.string().trim().max(5000).optional(),
  subject: z.enum(["math", "science"]),
  level: z.string().trim().min(1).max(20),
  thumbnail: z.string().url().optional().or(z.literal("")),
  sourceLanguage: z.enum(["vi", "en"]).optional(),
});

function formatCourse<
  T extends { subject: string; _count: { lessons: number } },
>(course: T) {
  const { _count, ...data } = course;
  return {
    ...data,
    lessonCount: _count.lessons,
    subjectLabel: course.subject === "math" ? "Toán học" : "Khoa học",
  };
}

function durationMinutes(value: string | null | undefined): number {
  if (!value) return 0;
  const match = value.match(/(\d+(?:\.\d+)?)\s*(h|hour|giờ|phút|min|minutes?|m)?/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  const unit = (match[2] ?? "phút").toLowerCase();
  return unit === "h" || unit === "hour" || unit === "giờ"
    ? amount * 60
    : unit === "m" ? amount : amount;
}

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });
    const lessons = await prisma.lesson.findMany({
      where: { courseId: { in: courses.map((course) => course.id) } },
      select: { courseId: true, duration: true },
    });
    const courseDurations = new Map<string, number>();
    for (const lesson of lessons) {
      courseDurations.set(lesson.courseId, (courseDurations.get(lesson.courseId) ?? 0) + durationMinutes(lesson.duration));
    }

    // Map data to match frontend expectations
    const formattedCourses = courses.map((course) => ({
      ...formatCourse(course),
      duration: courseDurations.get(course.id) ? `${Math.round(courseDurations.get(course.id)!)} phút` : undefined,
    }));

    res.json({ success: true, data: formattedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const getMyCourses = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const courses = await prisma.course.findMany({
      where: { createdById: req.user.id },
      include: { _count: { select: { lessons: true } } },
      orderBy: { updatedAt: "desc" },
    });
    const courseIds = courses.map((course) => course.id);
    const courseLessons = courseIds.length
      ? await prisma.lesson.findMany({
          where: { courseId: { in: courseIds } },
          select: { id: true, courseId: true, duration: true },
        })
      : [];
    const lessonIds = courseLessons.map((lesson) => lesson.id);
    const videos = lessonIds.length
      ? await prisma.video.findMany({
          where: { lessonId: { in: lessonIds } },
          select: { id: true, lessonId: true },
        })
      : [];
    const videoCourseIds = new Map(
      videos.map((video) => [
        video.id,
        courseLessons.find((lesson) => lesson.id === video.lessonId)!.courseId,
      ]),
    );
    const [viewEvents, progressRows] = await Promise.all([
      videos.length
        ? prisma.videoWatchEvent.findMany({
            where: { watchedMs: { gt: 0 }, videoId: { in: videos.map((video) => video.id) } },
            select: { userId: true, videoId: true },
          })
        : Promise.resolve([]),
      lessonIds.length
        ? prisma.progress.findMany({
            where: { lessonId: { in: lessonIds } },
            select: { userId: true, status: true, lessonId: true },
          })
        : Promise.resolve([]),
    ]);
    const durationByCourse = new Map<string, number>();
    for (const lesson of courseLessons) {
      durationByCourse.set(lesson.courseId, (durationByCourse.get(lesson.courseId) ?? 0) + durationMinutes(lesson.duration));
    }
    const viewers = new Map<string, Set<string>>();
    for (const event of viewEvents) {
      const courseId = videoCourseIds.get(event.videoId);
      if (!courseId) continue;
      const courseViewers = viewers.get(courseId) ?? new Set<string>();
      courseViewers.add(event.userId);
      viewers.set(courseId, courseViewers);
    }
    const response = courses.map((course) => {
      const courseViewers = [...(viewers.get(course.id) ?? [])];
      const completionRate = courseViewers.length && course._count.lessons
        ? Math.round(courseViewers.reduce((total, userId) => {
            const completed = progressRows.filter((row) =>
              row.userId === userId &&
              courseLessons.some((lesson) => lesson.id === row.lessonId && lesson.courseId === course.id) &&
              row.status === "COMPLETED",
            ).length;
            return total + Math.min(completed, course._count.lessons) / course._count.lessons;
          }, 0) / courseViewers.length * 100)
        : 0;
      const totalMinutes = durationByCourse.get(course.id) ?? 0;
      return {
        ...formatCourse(course),
        activeLearners: courseViewers.length,
        completionRate,
        duration: totalMinutes ? `${Math.round(totalMinutes)} phút` : undefined,
      };
    });
    res.json(success(response));
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Failed to load teacher courses:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      ...(process.env.NODE_ENV !== "production" && error instanceof Error
        ? { detail: error.message }
        : {}),
    });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const { sourceLanguage, ...parsed } = courseSchema.parse(req.body);
    let input = parsed;
    if (sourceLanguage) {
      const [title, description] = await Promise.all([
        toBilingualText(parsed.title, sourceLanguage),
        parsed.description
          ? toBilingualText(parsed.description, sourceLanguage)
          : null,
      ]);
      input = {
        ...parsed,
        title: title.vi,
        titleEn: title.en,
        description: description?.vi,
        descEn: description?.en,
      };
    }
    const course = await prisma.course.create({
      data: {
        ...input,
        thumbnail: input.thumbnail || null,
        createdById: req.user.id,
      },
      include: { _count: { select: { lessons: true } } },
    });
    res.status(201).json(success(formatCourse(course), "Course created"));
  } catch (error) {
    if (error instanceof AppError || error instanceof z.ZodError) throw error;
    console.error("Failed to create course:", error);
    throw error;
  }
};

async function getManagedCourse(req: Request) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const course = await prisma.course.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, createdById: true, thumbnail: true },
  });
  if (!course) throw new AppError("Course not found", 404);
  if (course.createdById !== req.user.id) {
    throw new AppError("You can only manage your own courses", 403);
  }
  return course;
}

export const updateCourse = async (req: Request, res: Response) => {
  const course = await getManagedCourse(req);
  const { sourceLanguage, ...input } = courseSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, "Nothing to update")
    .parse(req.body);
  const data: Record<string, string | null | undefined> = { ...input };
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
  if (input.thumbnail !== undefined) data.thumbnail = input.thumbnail || null;
  const updated = await prisma.course.update({
    where: { id: course.id },
    data,
    include: { _count: { select: { lessons: true } } },
  });
  if (input.thumbnail !== undefined && course.thumbnail !== data.thumbnail) {
    await removeCourseMediaByUrls([course.thumbnail]);
  }
  res.json(success(formatCourse(updated), "Course updated"));
};

const reorderLessonsSchema = z.object({
  lessonIds: z.array(z.string().uuid()).min(1).max(200),
});

export const reorderCourseLessons = async (req: Request, res: Response) => {
  const course = await getManagedCourse(req);
  const { lessonIds } = reorderLessonsSchema.parse(req.body);
  const lessons = await prisma.lesson.findMany({
    where: { courseId: course.id },
    select: { id: true },
  });
  const expected = new Set(lessons.map((lesson) => lesson.id));
  if (
    new Set(lessonIds).size !== lessonIds.length ||
    lessonIds.length !== expected.size ||
    lessonIds.some((id) => !expected.has(id))
  ) {
    throw new AppError("The lesson list is out of date. Reload and try again.", 409);
  }
  await prisma.$transaction(
    lessonIds.map((id, index) =>
      prisma.lesson.update({ where: { id }, data: { order: index + 1 } }),
    ),
  );
  res.json(success({ lessonIds }, "Lesson order updated"));
};

export const deleteCourse = async (req: Request, res: Response) => {
  const course = await getManagedCourse(req);
  const files = await prisma.course.findUnique({
    where: { id: course.id },
    select: {
      lessons: {
        select: {
          videos: { select: { url: true } },
          materials: { select: { url: true } },
        },
      },
    },
  });
  await prisma.course.delete({ where: { id: course.id } });
  await removeCourseMediaByUrls([
    course.thumbnail,
    ...(files?.lessons ?? []).flatMap((lesson) => [
      ...lesson.videos.map((video) => video.url),
      ...lesson.materials.map((material) => material.url),
    ]),
  ]);
  res.json(success({ id: course.id }, "Course deleted"));
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: {
            materials: true,
            videos: {
              orderBy: [{ order: "asc" }, { createdAt: "asc" }],
              select: {
                id: true,
                title: true,
                titleEn: true,
                url: true,
                durationSeconds: true,
                lessonId: true,
              },
            },
            quizzes: {
              include: {
                questions: {
                  orderBy: { createdAt: "asc" },
                  include: {
                    answers: {
                      select: { id: true, content: true, contentEn: true },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const { _count, ...courseData } = course;
    const canManageCourse =
      req.user?.role === "TEACHER" && course.createdById === req.user.id;
    const visibleCourseData = canManageCourse
      ? courseData
      : {
          ...courseData,
          lessons: course.lessons.map((lesson, index) => {
            return {
              id: lesson.id,
              title: lesson.title,
              titleEn: lesson.titleEn,
              description: index === 0 ? lesson.description : null,
              descEn: index === 0 ? lesson.descEn : null,
              order: lesson.order,
              duration: lesson.duration,
              courseId: lesson.courseId,
              isLocked: index > 0,
              isCompleted: false,
            };
          }),
        };
    const totalMinutes = course.lessons.reduce(
      (total, lesson) => total + durationMinutes(lesson.duration),
      0,
    );
    const formattedCourse = {
      ...visibleCourseData,
      lessonCount: _count.lessons,
      duration: totalMinutes ? `${Math.round(totalMinutes)} phút` : undefined,
      subjectLabel: course.subject === "math" ? "Toán học" : "Khoa học",
    };

    res.json({ success: true, data: formattedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
