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

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    // Map data to match frontend expectations
    const formattedCourses = courses.map(formatCourse);

    res.json({ success: true, data: formattedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const getMyCourses = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const courses = await prisma.course.findMany({
      where: req.user.role === "ADMIN" ? {} : { createdById: req.user.id },
      include: { _count: { select: { lessons: true } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json(success(courses.map(formatCourse)));
  } catch (error) {
    if (error instanceof AppError) throw error;
    res.status(500).json({ success: false, message: "Server error" });
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
  if (req.user.role !== "ADMIN" && course.createdById !== req.user.id) {
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
    const formattedCourse = {
      ...courseData,
      lessonCount: _count.lessons,
      subjectLabel: course.subject === "math" ? "Toán học" : "Khoa học",
    };

    res.json({ success: true, data: formattedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
