import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import {
  createFlashcardSchema,
  createPracticeQuestionSchema,
  submitPracticeAnswerSchema,
  updateFlashcardMasteredSchema,
} from "./schema.js";
import { studyService } from "./service.js";

function authenticatedUserId(req: Request): string {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user.id;
}

export async function listFlashcards(req: Request, res: Response) {
  const data = await studyService.listFlashcards(authenticatedUserId(req));
  res.json(success(data));
}

export async function createFlashcard(req: Request, res: Response) {
  const input = createFlashcardSchema.parse(req.body);
  const data = await studyService.createFlashcard(
    authenticatedUserId(req),
    input,
  );
  res.status(201).json(success(data, "Flashcard created"));
}

export async function updateFlashcardMastered(req: Request, res: Response) {
  const input = updateFlashcardMasteredSchema.parse(req.body);
  const data = await studyService.updateFlashcardMastered(
    authenticatedUserId(req),
    String(req.params.flashcardId),
    input.mastered,
  );
  res.json(success(data, "Flashcard updated"));
}

export async function deleteFlashcard(req: Request, res: Response) {
  const data = await studyService.deleteFlashcard(
    authenticatedUserId(req),
    String(req.params.flashcardId),
  );
  res.json(success(data, "Flashcard deleted"));
}

export async function listPracticeQuestions(req: Request, res: Response) {
  const data = await studyService.listPracticeQuestions(
    authenticatedUserId(req),
  );
  res.json(success(data));
}

export async function createPracticeQuestion(req: Request, res: Response) {
  const input = createPracticeQuestionSchema.parse(req.body);
  const data = await studyService.createPracticeQuestion(
    authenticatedUserId(req),
    input,
  );
  res.status(201).json(success(data, "Practice question created"));
}

export async function submitPracticeAnswer(req: Request, res: Response) {
  const input = submitPracticeAnswerSchema.parse(req.body);
  const data = await studyService.submitPracticeAnswer(
    authenticatedUserId(req),
    String(req.params.questionId),
    input.selectedAnswerIndex,
  );
  res.json(success(data, "Practice answer checked"));
}
