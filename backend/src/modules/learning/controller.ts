import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import {
  createLessonQuizSchema,
  createLessonVideoSchema,
  saveProgressSchema,
  checkQuizAnswerSchema,
  submitQuizSchema,
  submitInteractiveEventSchema,
  submitVideoActivitySchema,
} from "./schema.js";
import { learningService } from "./service.js";

function authenticatedUserId(req: Request): string {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  return req.user.id;
}

function authenticatedRole(req: Request) {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user.role;
}

export async function getMyProgress(req: Request, res: Response) {
  const data = await learningService.getProgress(authenticatedUserId(req));
  res.json(success(data));
}

export async function listAvailableQuizzes(_req: Request, res: Response) {
  const data = await learningService.listAvailableQuizzes();
  res.json(success(data));
}

export async function createLessonQuiz(req: Request, res: Response) {
  const input = createLessonQuizSchema.parse(req.body);
  const data = await learningService.createLessonQuiz(
    String(req.params.lessonId),
    authenticatedUserId(req),
    authenticatedRole(req),
    input,
  );
  res.status(201).json(success(data, "Lesson quiz created"));
}

export async function createLessonVideo(req: Request, res: Response) {
  const input = createLessonVideoSchema.parse(req.body);
  const data = await learningService.createLessonVideo(
    String(req.params.lessonId),
    authenticatedUserId(req),
    authenticatedRole(req),
    input,
  );
  res.status(201).json(success(data, "Lesson video created"));
}

export async function submitVideoActivityAnswer(req: Request, res: Response) {
  const input = submitVideoActivitySchema.parse(req.body);
  const data = await learningService.submitVideoActivityAnswer(
    String(req.params.videoId),
    String(req.params.activityId),
    input,
  );
  res.json(success(data, "Checkpoint answer checked"));
}

export async function submitInteractiveEventResponse(
  req: Request,
  res: Response,
) {
  const input = submitInteractiveEventSchema.parse(req.body);
  const data = await learningService.submitInteractiveEventResponse(
    authenticatedUserId(req),
    String(req.params.videoId),
    String(req.params.activityId),
    input,
    authenticatedRole(req),
  );
  res.json(success(data, "Interactive event response saved"));
}

export async function getInteractiveVideoAnalytics(
  req: Request,
  res: Response,
) {
  const data = await learningService.getInteractiveVideoAnalytics(
    String(req.params.videoId),
    authenticatedUserId(req),
    authenticatedRole(req),
  );
  res.json(success(data));
}

export async function saveProgress(req: Request, res: Response) {
  const body = saveProgressSchema.parse(req.body);
  const data = await learningService.saveProgress(
    authenticatedUserId(req),
    String(req.params.lessonId),
    body,
  );
  res.json(success(data, "Progress saved"));
}

export async function getMyQuizAttempts(req: Request, res: Response) {
  const quizId =
    typeof req.query.quizId === "string" ? req.query.quizId : undefined;
  const data = await learningService.getQuizAttempts(
    authenticatedUserId(req),
    quizId,
  );
  res.json(success(data));
}

export async function checkQuizAnswer(req: Request, res: Response) {
  const body = checkQuizAnswerSchema.parse(req.body);
  const data = await learningService.checkQuizAnswer(
    String(req.params.quizId),
    String(req.params.questionId),
    body.answerId,
  );
  res.json(success(data));
}

export async function submitQuizAttempt(req: Request, res: Response) {
  const body = submitQuizSchema.parse(req.body);
  const data = await learningService.submitQuizAttempt(
    authenticatedUserId(req),
    String(req.params.quizId),
    body,
  );
  res.status(201).json(success(data, "Quiz attempt saved"));
}
