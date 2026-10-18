import { z } from "zod";

export const createFlashcardSchema = z.object({
  front: z.string().trim().min(1).max(2000),
  back: z.string().trim().min(1).max(4000),
  tag: z.string().trim().min(1).max(100),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
});

export const updateFlashcardMasteredSchema = z.object({
  mastered: z.boolean(),
});

export const createPracticeQuestionSchema = z
  .object({
    question: z.string().trim().min(2).max(2000),
    options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
    correctAnswerIndex: z.number().int().nonnegative(),
    explanation: z.string().trim().max(2000).default("Correct answer."),
    topic: z.string().trim().min(1).max(100),
  })
  .superRefine((input, context) => {
    if (input.correctAnswerIndex >= input.options.length) {
      context.addIssue({
        code: "custom",
        path: ["correctAnswerIndex"],
        message: "The correct answer must match an available option",
      });
    }
  });

export const submitPracticeAnswerSchema = z.object({
  selectedAnswerIndex: z.number().int().nonnegative(),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type CreatePracticeQuestionInput = z.infer<
  typeof createPracticeQuestionSchema
>;
