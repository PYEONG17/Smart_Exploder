import { Prisma, ProgressStatus } from "@prisma/client";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { toBilingualText } from "../ai/translate.js";
import { refreshLessonDuration } from "../../utils/lesson-duration.js";
import type {
  CreateLessonQuizInput,
  CreateLessonVideoInput,
  SaveProgressInput,
  SubmitInteractiveEventInput,
  SubmitQuizInput,
  SubmitVideoActivityInput,
} from "./schema.js";

function parseActivityContent(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Expected object payload");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new AppError("Video event content is invalid", 500);
  }
}

function normalizedAnswer(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

async function getManagedLesson(
  lessonId: string,
  userId: string,
  role: "STUDENT" | "TEACHER" | "ADMIN",
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      course: { select: { createdById: true } },
    },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);
  if (role !== "ADMIN" && lesson.course.createdById !== userId) {
    throw new AppError("You can only edit content in your own courses", 403);
  }
  return lesson;
}

async function assertLessonUnlocked(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, order: true, courseId: true },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);
  const previous = await prisma.lesson.findMany({
    where: { courseId: lesson.courseId, order: { lt: lesson.order } },
    select: { id: true },
  });
  if (!previous.length) return;
  const completed = await prisma.progress.findMany({
    where: {
      userId,
      lessonId: { in: previous.map((item) => item.id) },
      status: "COMPLETED",
    },
    select: { lessonId: true },
  });
  if (completed.length !== previous.length) {
    throw new AppError("Finish the previous lesson to unlock this lesson", 403);
  }
}

export const learningService = {
  async createLessonQuiz(
    lessonId: string,
    userId: string,
    role: "STUDENT" | "TEACHER" | "ADMIN",
    input: CreateLessonQuizInput,
  ) {
    await getManagedLesson(lessonId, userId, role);
    const title = input.title
      ? input.sourceLanguage
        ? await toBilingualText(input.title, input.sourceLanguage)
        : { vi: input.title, en: input.titleEn }
      : { vi: "Bài tập", en: "Assignment" };
    return prisma.quiz.create({
      data: {
        lessonId,
        title: title.vi,
        titleEn: title.en,
        questions: {
          create: input.questions.map((question) => ({
            question: question.question,
            questionEn: question.questionEn,
            type: question.type,
            answers: { create: question.answers },
          })),
        },
      },
      include: {
        questions: { include: { answers: true } },
      },
    });
  },

  async createLessonVideo(
    lessonId: string,
    userId: string,
    role: "STUDENT" | "TEACHER" | "ADMIN",
    input: CreateLessonVideoInput,
  ) {
    await getManagedLesson(lessonId, userId, role);
    const title = input.title
      ? input.sourceLanguage
        ? await toBilingualText(input.title, input.sourceLanguage)
        : { vi: input.title, en: input.titleEn }
      : { vi: "Video bài giảng", en: "Lecture video" };
    const lastVideo = await prisma.video.aggregate({
      where: { lessonId },
      _max: { order: true },
    });
    const video = await prisma.video.create({
      data: {
        lessonId,
        order: (lastVideo._max.order ?? 0) + 1,
        title: title.vi,
        titleEn: title.en,
        url: input.url,
        durationSeconds: input.durationSeconds,
        activities: {
          create: (input.activities ?? []).map((activity) => {
            const timestampMs =
              activity.timestampMs ?? (activity.timestamp ?? 0) * 1000;
            return {
              timestamp: Math.floor(timestampMs / 1000),
              timestampMs,
              type: activity.type,
              content: JSON.stringify(activity.content),
            };
          }),
        },
      },
      include: { activities: true },
    });
    await refreshLessonDuration(lessonId);
    return video;
  },

  async submitVideoActivityAnswer(
    userId: string,
    videoId: string,
    activityId: string,
    input: SubmitVideoActivityInput,
  ) {
    const activity = await prisma.interactiveActivity.findFirst({
      where: { id: activityId, videoId },
      select: { id: true, content: true, video: { select: { lessonId: true } } },
    });
    if (!activity) throw new AppError("Video checkpoint not found", 404);
    await assertLessonUnlocked(userId, activity.video.lessonId);

    let content: {
      correctIndex: number;
      options: string[];
      explanation?: string;
      explanationEn?: string;
    };
    try {
      content = JSON.parse(activity.content) as typeof content;
    } catch {
      throw new AppError("Video checkpoint content is invalid", 500);
    }
    if (
      !Number.isInteger(content.correctIndex) ||
      input.selectedIndex >= content.options.length
    ) {
      throw new AppError("Video checkpoint content is invalid", 500);
    }

    return {
      isCorrect: input.selectedIndex === content.correctIndex,
      explanation: content.explanation ?? null,
      explanationEn: content.explanationEn ?? null,
    };
  },

  async submitInteractiveEventResponse(
    userId: string,
    videoId: string,
    activityId: string,
    input: SubmitInteractiveEventInput,
    role: string = "STUDENT",
  ) {
    // Teachers/admins previewing their own lesson get graded feedback but nothing is stored.
    const isPreview = role !== "STUDENT";
    const priorResponse = isPreview ? null : await prisma.interactiveResponse.findUnique({
      where: {
        userId_clientEventId: {
          userId,
          clientEventId: input.clientEventId,
        },
      },
    });
    if (priorResponse) {
      if (priorResponse.activityId !== activityId) {
        throw new AppError("Idempotency key was already used", 409);
      }
      return {
        attemptId: priorResponse.id,
        accepted: true,
        isCorrect: priorResponse.isCorrect,
        score: priorResponse.score,
        explanation: null,
        explanationEn: null,
      };
    }

    const activity = await prisma.interactiveActivity.findFirst({
      where: { id: activityId, videoId },
      include: {
        video: {
          select: { lessonId: true, lesson: { select: { course: { select: { createdById: true } } } } },
        },
      },
    });
    if (!activity) throw new AppError("Video event not found", 404);
    if (!isPreview) await assertLessonUnlocked(userId, activity.video.lessonId);
    if (
      isPreview &&
      role !== "ADMIN" &&
      activity.video.lesson.course.createdById !== userId
    ) {
      throw new AppError("You can only preview your own courses", 403);
    }
    if (input.response.type !== activity.type) {
      throw new AppError("Response type does not match video event", 400);
    }

    const content = parseActivityContent(activity.content);
    const response = input.response;
    let isCorrect: boolean | null = null;
    let score: number | null = null;

    switch (activity.type) {
      case "QUESTION":
      case "QUIZ": {
        const options = asStringArray(content.options);
        if (
          !Number.isInteger(content.correctIndex) ||
          typeof content.correctIndex !== "number" ||
          content.correctIndex < 0 ||
          content.correctIndex >= options.length
        ) {
          throw new AppError("Video event answer key is invalid", 500);
        }
        if (response.type !== activity.type || response.selectedIndex >= options.length) {
          throw new AppError("Selected option is invalid", 400);
        }
        isCorrect = response.selectedIndex === content.correctIndex;
        score = isCorrect ? 1 : 0;
        break;
      }
      case "DRAG_DROP": {
        if (response.type !== "DRAG_DROP") {
          throw new AppError("Response type does not match video event", 400);
        }
        const items = Array.isArray(content.items)
          ? content.items.map(asObject)
          : [];
        const validItems = items.filter(
          (item): item is Record<string, unknown> => item !== null,
        );
        const expectedIds = validItems.map((item) => item.id);
        const zoneIds = Array.isArray(content.zones)
          ? content.zones.map(asObject).flatMap((zone) =>
              typeof zone?.id === "string" ? [zone.id] : [],
            )
          : [];
        if (
          expectedIds.length < 2 ||
          expectedIds.some((id) => typeof id !== "string") ||
          validItems.some((item) => typeof item.targetZoneId !== "string")
        ) {
          throw new AppError("Drag-and-drop answer key is invalid", 500);
        }
        if (
          Object.keys(response.assignments).length !== expectedIds.length ||
          expectedIds.some(
            (id) =>
              typeof id !== "string" ||
              !(id in response.assignments) ||
              !zoneIds.includes(response.assignments[id]),
          )
        ) {
          throw new AppError("Every item must be assigned to a valid zone", 400);
        }
        const correctCount = validItems.filter(
          (item) => response.assignments[String(item.id)] === item.targetZoneId,
        ).length;
        score = correctCount / validItems.length;
        isCorrect = correctCount === validItems.length;
        break;
      }
      case "MATCHING": {
        if (response.type !== "MATCHING") {
          throw new AppError("Response type does not match video event", 400);
        }
        const leftIds = Array.isArray(content.leftItems)
          ? content.leftItems.map(asObject).flatMap((item) =>
              typeof item?.id === "string" ? [item.id] : [],
            )
          : [];
        const rightIds = Array.isArray(content.rightItems)
          ? content.rightItems.map(asObject).flatMap((item) =>
              typeof item?.id === "string" ? [item.id] : [],
            )
          : [];
        const correctPairs = Array.isArray(content.correctPairs)
          ? content.correctPairs.map(asObject).filter(
              (pair): pair is Record<string, unknown> => pair !== null,
            )
          : [];
        if (
          leftIds.length < 2 ||
          correctPairs.length !== leftIds.length ||
          correctPairs.some(
            (pair) =>
              typeof pair.leftId !== "string" ||
              typeof pair.rightId !== "string" ||
              !leftIds.includes(pair.leftId) ||
              !rightIds.includes(pair.rightId),
          )
        ) {
          throw new AppError("Matching answer key is invalid", 500);
        }
        if (
          Object.keys(response.pairs).length !== leftIds.length ||
          leftIds.some(
            (id) =>
              !(id in response.pairs) || !rightIds.includes(response.pairs[id]),
          )
        ) {
          throw new AppError("Each left item must be matched once", 400);
        }
        const correctCount = correctPairs.filter(
          (pair) => response.pairs[String(pair.leftId)] === pair.rightId,
        ).length;
        score = correctCount / leftIds.length;
        isCorrect = correctCount === leftIds.length;
        break;
      }
      case "FILL_BLANK": {
        if (response.type !== "FILL_BLANK") {
          throw new AppError("Response type does not match video event", 400);
        }
        const blanks = Array.isArray(content.blanks)
          ? content.blanks.map(asObject).filter(
              (blank): blank is Record<string, unknown> => blank !== null,
            )
          : [];
        const blankIds = blanks.map((blank) => blank.id);
        if (
          blankIds.length === 0 ||
          blankIds.some((id) => typeof id !== "string") ||
          blanks.some((blank) => asStringArray(blank.acceptedAnswers).length === 0)
        ) {
          throw new AppError("Fill-in-the-blank answer key is invalid", 500);
        }
        if (
          Object.keys(response.values).length !== blankIds.length ||
          blankIds.some(
            (id) => typeof id !== "string" || !(id in response.values),
          )
        ) {
          throw new AppError("Every blank must have an answer", 400);
        }
        const correctCount = blanks.filter((blank) => {
          const submitted = response.values[String(blank.id)];
          return asStringArray(blank.acceptedAnswers).some(
            (accepted) => normalizedAnswer(accepted) === normalizedAnswer(submitted),
          );
        }).length;
        score = correctCount / blanks.length;
        isCorrect = correctCount === blanks.length;
        break;
      }
      case "POLL": {
        if (response.type !== "POLL") {
          throw new AppError("Response type does not match video event", 400);
        }
        const optionIds = Array.isArray(content.options)
          ? content.options.map(asObject).flatMap((option) =>
              typeof option?.id === "string" ? [option.id] : [],
            )
          : [];
        const uniqueSelection = new Set(response.selectedOptionIds);
        if (
          optionIds.length < 2 ||
          uniqueSelection.size !== response.selectedOptionIds.length ||
          response.selectedOptionIds.some((id) => !optionIds.includes(id)) ||
          (content.allowMultiple !== true && response.selectedOptionIds.length !== 1)
        ) {
          throw new AppError("Poll selection is invalid", 400);
        }
        break;
      }
      case "REFLECTION": {
        if (response.type !== "REFLECTION") {
          throw new AppError("Response type does not match video event", 400);
        }
        const minLength =
          typeof content.minLength === "number" ? content.minLength : 0;
        const maxLength =
          typeof content.maxLength === "number" ? content.maxLength : 1000;
        if (response.text.length < minLength || response.text.length > maxLength) {
          throw new AppError("Reflection response length is invalid", 400);
        }
        break;
      }
      case "VOCABULARY":
      case "AI_EXPLANATION":
      case "EXPLANATION":
        if (
          response.type !== activity.type ||
          response.viewed !== true
        ) {
          throw new AppError("Event view response is invalid", 400);
        }
        break;
    }

    if (isPreview) {
      return {
        attemptId: "preview",
        accepted: true,
        isCorrect,
        score,
        explanation:
          typeof content.explanation === "string" ? content.explanation : null,
        explanationEn:
          typeof content.explanationEn === "string" ? content.explanationEn : null,
      };
    }

    try {
      const saved = await prisma.interactiveResponse.create({
        data: {
          userId,
          activityId,
          clientEventId: input.clientEventId,
          response,
          isCorrect,
          score,
          durationMs: input.durationMs,
        },
      });
      return {
        attemptId: saved.id,
        accepted: true,
        isCorrect,
        score,
        explanation:
          typeof content.explanation === "string" ? content.explanation : null,
        explanationEn:
          typeof content.explanationEn === "string"
            ? content.explanationEn
            : null,
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const existing = await prisma.interactiveResponse.findUnique({
          where: {
            userId_clientEventId: {
              userId,
              clientEventId: input.clientEventId,
            },
          },
        });
        if (existing?.activityId === activityId) {
          return {
            attemptId: existing.id,
            accepted: true,
            isCorrect: existing.isCorrect,
            score: existing.score,
            explanation:
              typeof content.explanation === "string"
                ? content.explanation
                : null,
            explanationEn:
              typeof content.explanationEn === "string"
                ? content.explanationEn
                : null,
          };
        }
      }
      throw error;
    }
  },

  async getInteractiveVideoAnalytics(videoId: string, userId: string, role: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        lesson: { select: { course: { select: { createdById: true } } } },
        activities: {
          orderBy: [{ timestampMs: "asc" }, { timestamp: "asc" }],
          select: { id: true, timestampMs: true, timestamp: true, type: true },
        },
      },
    });
    if (!video) throw new AppError("Video not found", 404);
    if (role !== "ADMIN" && video.lesson.course.createdById !== userId) {
      throw new AppError("You can only view analytics for your own courses", 403);
    }

    const groups = await prisma.interactiveResponse.groupBy({
      by: ["activityId", "isCorrect"],
      where: { activityId: { in: video.activities.map((activity) => activity.id) } },
      _count: { _all: true },
      _avg: { durationMs: true, score: true },
    });
    const participantRows = await prisma.interactiveResponse.findMany({
      where: { activityId: { in: video.activities.map((activity) => activity.id) } },
      distinct: ["activityId", "userId"],
      select: { activityId: true, userId: true },
    });
    const pollActivityIds = video.activities
      .filter((activity) => activity.type === "POLL")
      .map((activity) => activity.id);
    const pollOptionRows = pollActivityIds.length
      ? await prisma.$queryRaw<
          { activityId: string; optionId: string; count: bigint }[]
        >(Prisma.sql`
          SELECT
            response."activity_id" AS "activityId",
            option."option_id" AS "optionId",
            COUNT(*) AS "count"
          FROM "InteractiveResponse" AS response
          CROSS JOIN LATERAL jsonb_array_elements_text(
            CASE
              WHEN jsonb_typeof(response."response"->'selectedOptionIds') = 'array'
                THEN response."response"->'selectedOptionIds'
              ELSE '[]'::jsonb
            END
          ) AS option("option_id")
          WHERE response."activity_id" IN (${Prisma.join(pollActivityIds)})
          GROUP BY response."activity_id", option."option_id"
        `)
      : [];

    return video.activities.map((activity) => {
      const eventGroups = groups.filter((group) => group.activityId === activity.id);
      const participants = participantRows.filter(
        (row) => row.activityId === activity.id,
      ).length;
      const attempts = eventGroups.reduce((total, group) => total + group._count._all, 0);
      const gradedGroups = eventGroups.filter((group) => group.isCorrect !== null);
      const gradedAttempts = gradedGroups.reduce(
        (total, group) => total + group._count._all,
        0,
      );
      const correctAttempts = eventGroups
        .filter((group) => group.isCorrect === true)
        .reduce((total, group) => total + group._count._all, 0);
      const averageDuration =
        attempts === 0
          ? null
          : eventGroups.reduce(
              (total, group) =>
                total + (group._avg.durationMs ?? 0) * group._count._all,
              0,
            ) / attempts;
      return {
        activityId: activity.id,
        timestampMs: activity.timestampMs ?? activity.timestamp * 1000,
        type: activity.type,
        attempts,
        uniqueParticipants: participants,
        gradedAttempts,
        correctAttempts,
        correctnessRate:
          gradedAttempts === 0 ? null : correctAttempts / gradedAttempts,
        averageDurationMs: averageDuration,
        pollOptionCounts:
          activity.type === "POLL"
            ? Object.fromEntries(
                pollOptionRows
                  .filter((row) => row.activityId === activity.id)
                  .map((row) => [row.optionId, Number(row.count)]),
              )
            : null,
      };
    });
  },

  async listAvailableQuizzes(userId: string) {
    const [quizzes, lessons, completedRows] = await Promise.all([
      prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            course: { select: { id: true, title: true, titleEn: true } },
          },
        },
        questions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            question: true,
            questionEn: true,
            type: true,
            answers: {
              select: { id: true, content: true, contentEn: true },
            },
          },
        },
      },
      }),
      prisma.lesson.findMany({ select: { id: true, courseId: true, order: true } }),
      prisma.progress.findMany({ where: { userId, status: "COMPLETED" }, select: { lessonId: true } }),
    ]);
    const completed = new Set(completedRows.map((item) => item.lessonId));
    const unlocked = new Set(lessons.filter((lesson) =>
      lessons.every((previous) => previous.courseId !== lesson.courseId || previous.order >= lesson.order || completed.has(previous.id)),
    ).map((lesson) => lesson.id));
    return quizzes.filter((quiz) => unlocked.has(quiz.lesson.id));
  },

  getProgress(userId: string) {
    return prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            courseId: true,
            course: { select: { id: true, title: true, titleEn: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async saveProgress(
    userId: string,
    lessonId: string,
    input: SaveProgressInput,
  ) {
    await assertLessonUnlocked(userId, lessonId);
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lessonExists) {
      throw new AppError("Lesson not found", 404);
    }

    const completed = input.status === ProgressStatus.COMPLETED;
    return prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: input.status,
        completedAt: completed ? new Date() : null,
      },
      update: {
        status: input.status,
        completedAt: completed ? new Date() : null,
      },
    });
  },

  getQuizAttempts(userId: string, quizId?: string) {
    return prisma.quizAttempt.findMany({
      where: { userId, ...(quizId ? { quizId } : {}) },
      include: {
        quiz: {
          select: { id: true, title: true, titleEn: true, lessonId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async submitQuizAttempt(
    userId: string,
    quizId: string,
    input: SubmitQuizInput,
  ) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { answers: { select: { id: true, isCorrect: true } } },
        },
      },
    });
    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }
    await assertLessonUnlocked(userId, quiz.lessonId);
    if (quiz.questions.length === 0) {
      throw new AppError("This quiz has no questions", 400);
    }
    const questionIds = new Set(quiz.questions.map((question) => question.id));
    if (Object.keys(input.answers).some((id) => !questionIds.has(id))) {
      throw new AppError("An answer does not belong to this quiz", 400);
    }

    // Unanswered questions (for example when a timed test runs out) score zero.
    let score = 0;
    const review = quiz.questions.map((question) => {
      const selectedAnswerId = input.answers[question.id] ?? null;
      if (selectedAnswerId !== null) {
        const chosen = question.answers.find((item) => item.id === selectedAnswerId);
        if (!chosen) {
          throw new AppError("An answer does not belong to its question", 400);
        }
        if (chosen.isCorrect) score += 1;
      }
      return {
        questionId: question.id,
        selectedAnswerId,
        correctAnswerIds: question.answers
          .filter((item) => item.isCorrect)
          .map((item) => item.id),
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const [attempt] = await prisma.$transaction([
      prisma.quizAttempt.create({
        data: {
          userId,
          quizId,
          answers: input.answers,
          score,
          totalQuestions,
          percentage,
        },
        select: {
          id: true,
          quizId: true,
          score: true,
          totalQuestions: true,
          percentage: true,
          createdAt: true,
        },
      }),
      prisma.progress.upsert({
        where: { userId_lessonId: { userId, lessonId: quiz.lessonId } },
        create: {
          userId,
          lessonId: quiz.lessonId,
          status: ProgressStatus.IN_PROGRESS,
          score: percentage,
        },
        update: { score: percentage },
      }),
    ]);

    return { ...attempt, review };
  },

  async checkQuizAnswer(userId: string, quizId: string, questionId: string, answerId: string) {
    const question = await prisma.question.findFirst({
      where: { id: questionId, quizId },
      include: { answers: { select: { id: true, isCorrect: true } }, quiz: { select: { lessonId: true } } },
    });
    if (!question) throw new AppError("Question not found", 404);
    await assertLessonUnlocked(userId, question.quiz.lessonId);
    const chosen = question.answers.find((item) => item.id === answerId);
    if (!chosen) {
      throw new AppError("An answer does not belong to its question", 400);
    }
    return {
      isCorrect: chosen.isCorrect,
      correctAnswerIds: question.answers
        .filter((item) => item.isCorrect)
        .map((item) => item.id),
    };
  },
};
