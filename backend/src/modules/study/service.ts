import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import type {
  CreateFlashcardInput,
  CreatePracticeQuestionInput,
} from "./schema.js";

const practiceQuestionListSelect = {
  id: true,
  question: true,
  options: true,
  explanation: true,
  topic: true,
  createdAt: true,
} as const;

export const studyService = {
  listFlashcards(userId: string) {
    return prisma.studyFlashcard.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
  },

  createFlashcard(userId: string, input: CreateFlashcardInput) {
    return prisma.studyFlashcard.create({
      data: { ...input, userId },
    });
  },

  async updateFlashcardMastered(
    userId: string,
    flashcardId: string,
    mastered: boolean,
  ) {
    const result = await prisma.studyFlashcard.updateMany({
      where: { id: flashcardId, userId },
      data: { mastered },
    });
    if (result.count === 0) throw new AppError("Flashcard not found", 404);
    return prisma.studyFlashcard.findFirstOrThrow({
      where: { id: flashcardId, userId },
    });
  },

  async deleteFlashcard(userId: string, flashcardId: string) {
    const result = await prisma.studyFlashcard.deleteMany({
      where: { id: flashcardId, userId },
    });
    if (result.count === 0) throw new AppError("Flashcard not found", 404);
    return { id: flashcardId };
  },

  listPracticeQuestions(userId: string) {
    return prisma.practiceQuestion.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: practiceQuestionListSelect,
    });
  },

  createPracticeQuestion(userId: string, input: CreatePracticeQuestionInput) {
    return prisma.practiceQuestion.create({
      data: { ...input, userId },
      select: practiceQuestionListSelect,
    });
  },

  async submitPracticeAnswer(
    userId: string,
    questionId: string,
    selectedAnswerIndex: number,
  ) {
    const question = await prisma.practiceQuestion.findFirst({
      where: { id: questionId, userId },
      select: {
        correctAnswerIndex: true,
        options: true,
        explanation: true,
      },
    });
    if (!question) throw new AppError("Practice question not found", 404);
    if (selectedAnswerIndex >= question.options.length) {
      throw new AppError("Selected answer is not available", 400);
    }

    const isCorrect = selectedAnswerIndex === question.correctAnswerIndex;
    await prisma.practiceAnswerAttempt.create({
      data: { userId, questionId, selectedAnswerIndex, isCorrect },
    });

    return {
      isCorrect,
      correctAnswerIndex: question.correctAnswerIndex,
      explanation: question.explanation,
    };
  },
};
