import { z } from "zod";

const bilingualTextSchema = z.object({
  english: z.string().trim().min(1).max(4000),
  vietnamese: z.string().trim().min(1).max(4000),
});

export const tutorAnswerSchema = z.object({
  grade_level: z.string().trim().min(1).max(40),
  subject: z.string().trim().min(1).max(100),
  difficulty_adaptation: bilingualTextSchema,
  explanation: bilingualTextSchema,
  examples: z
    .array(bilingualTextSchema)
    .min(1)
    .max(3),
  illustration: bilingualTextSchema,
  follow_up_question: bilingualTextSchema,
});

export type TutorAnswer = z.infer<typeof tutorAnswerSchema>;
