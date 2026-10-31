import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { toBilingualText } from "../ai/translate.js";

const questionSchema = z.object({
  text: z.string().trim().min(3).max(3000),
  language: z.enum(["vi", "en"]),
});

const answerSchema = z.object({
  text: z.string().trim().min(2).max(5000),
  language: z.enum(["vi", "en"]),
});

function userId(req: Request): string {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user.id;
}

export async function listLessonQuestions(req: Request, res: Response) {
  const lessonId = String(req.params.lessonId);
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);
  const questions = await prisma.lessonQuestion.findMany({
    where: { lessonId },
    select: {
      id: true,
      lessonId: true,
      authorId: true,
      question: true,
      questionLanguage: true,
      questionTranslated: true,
      answer: true,
      answerLanguage: true,
      answerTranslated: true,
      answeredById: true,
      answeredAt: true,
      createdAt: true,
      author: { select: { name: true } },
      answeredBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(success(questions));
}

export async function askLessonQuestion(req: Request, res: Response) {
  const lessonId = String(req.params.lessonId);
  const input = questionSchema.parse(req.body);
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true },
  });
  if (!lesson) throw new AppError("Lesson not found", 404);

  const bilingual = await toBilingualText(input.text, input.language);
  const translation = input.language === "vi" ? bilingual.en : bilingual.vi;
  const question = await prisma.lessonQuestion.create({
    data: {
      lessonId,
      authorId: userId(req),
      question: input.text,
      questionLanguage: input.language,
      questionTranslated: translation,
    },
    select: {
      id: true,
      lessonId: true,
      authorId: true,
      question: true,
      questionLanguage: true,
      questionTranslated: true,
      answer: true,
      answerLanguage: true,
      answerTranslated: true,
      answeredById: true,
      answeredAt: true,
      createdAt: true,
      author: { select: { name: true } },
      answeredBy: { select: { name: true } },
    },
  });
  res.status(201).json(success(question, "Question posted"));
}

export async function answerLessonQuestion(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const input = answerSchema.parse(req.body);
  const questionId = String(req.params.questionId);
  const existing = await prisma.lessonQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      lesson: {
        select: {
          course: { select: { createdById: true } },
        },
      },
    },
  });
  if (!existing) throw new AppError("Question not found", 404);
  if (
    existing.lesson.course.createdById !== req.user.id
  ) {
    throw new AppError("You can only answer questions in your own courses", 403);
  }

  const bilingual = await toBilingualText(input.text, input.language);
  const translation = input.language === "vi" ? bilingual.en : bilingual.vi;
  const answer = await prisma.lessonQuestion.update({
    where: { id: questionId },
    data: {
      answer: input.text,
      answerLanguage: input.language,
      answerTranslated: translation,
      answeredById: req.user.id,
      answeredAt: new Date(),
    },
    select: {
      id: true,
      lessonId: true,
      authorId: true,
      question: true,
      questionLanguage: true,
      questionTranslated: true,
      answer: true,
      answerLanguage: true,
      answerTranslated: true,
      answeredById: true,
      answeredAt: true,
      createdAt: true,
      author: { select: { name: true } },
      answeredBy: { select: { name: true } },
    },
  });
  res.json(success(answer, "Answer saved"));
}
