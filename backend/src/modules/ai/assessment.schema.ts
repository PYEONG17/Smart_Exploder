import { z } from "zod";

const questionTypeSchema = z.enum([
  "MCQ",
  "TRUE_FALSE",
  "MATCHING",
  "FILL_BLANK",
  "SHORT_ANSWER",
]);

const bloomLevelSchema = z.enum([
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE",
]);

const generatedQuestionSchema = z.discriminatedUnion("type", [
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("MCQ"),
    prompt: z.string().trim().min(1).max(2000),
    choices: z.array(z.string().trim().min(1).max(500)).min(3).max(5),
    bloom_taxonomy: bloomLevelSchema,
    difficulty_score: z.number().int().min(1).max(5),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("TRUE_FALSE"),
    prompt: z.string().trim().min(1).max(2000),
    bloom_taxonomy: bloomLevelSchema,
    difficulty_score: z.number().int().min(1).max(5),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("MATCHING"),
    prompt: z.string().trim().min(1).max(2000),
    left_items: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
    right_items: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
    bloom_taxonomy: bloomLevelSchema,
    difficulty_score: z.number().int().min(1).max(5),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("FILL_BLANK"),
    prompt: z.string().trim().min(1).max(2000),
    bloom_taxonomy: bloomLevelSchema,
    difficulty_score: z.number().int().min(1).max(5),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("SHORT_ANSWER"),
    prompt: z.string().trim().min(1).max(2000),
    max_points: z.number().int().min(1).max(20),
    bloom_taxonomy: bloomLevelSchema,
    difficulty_score: z.number().int().min(1).max(5),
  }),
]);

const generatedAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("MCQ"),
    correct_answer: z.string().trim().min(1).max(500),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("TRUE_FALSE"),
    correct_answer: z.boolean(),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("MATCHING"),
    correct_pairs: z
      .array(
        z.object({
          left: z.string().trim().min(1).max(300),
          right: z.string().trim().min(1).max(300),
        }),
      )
      .min(2)
      .max(6),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("FILL_BLANK"),
    correct_answer: z.string().trim().min(1).max(1000),
    acceptable_answers: z.array(z.string().trim().min(1).max(500)).max(8),
  }),
  z.object({
    question_number: z.number().int().positive(),
    type: z.literal("SHORT_ANSWER"),
    answer_guide: z.string().trim().min(1).max(2000),
    rubric: z
      .array(
        z.object({
          criterion: z.string().trim().min(1).max(500),
          points: z.number().positive().max(20),
        }),
      )
      .min(1)
      .max(8),
  }),
]);

const generatedExplanationSchema = z.object({
  question_number: z.number().int().positive(),
  explanation: z.string().trim().min(1).max(2000),
});

export const generateAssessmentRequestSchema = z.object({
  grade: z.number().int().min(1).max(9),
  subject: z.string().trim().min(2).max(100),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topic: z.string().trim().min(2).max(240),
  question_count: z.number().int().min(5).max(30),
  locale: z.enum(["vi", "en"]).default("vi"),
});

export const generatedAssessmentSchema = z
  .object({
    quiz: z.object({
      title: z.string().trim().min(2).max(200),
      grade: z.number().int().min(1).max(9),
      subject: z.string().trim().min(2).max(100),
      topic: z.string().trim().min(2).max(240),
      target_difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
      question_count: z.number().int().min(5).max(30),
    }),
    questions: z.array(generatedQuestionSchema).min(5).max(30),
    answers: z.array(generatedAnswerSchema).min(5).max(30),
    explanations: z.array(generatedExplanationSchema).min(5).max(30),
    difficulty_score: z.number().min(1).max(5),
  })
  .superRefine((assessment, context) => {
    const count = assessment.quiz.question_count;
    if (
      assessment.questions.length !== count ||
      assessment.answers.length !== count ||
      assessment.explanations.length !== count
    ) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question, answer, and explanation counts must match the requested count",
      });
      return;
    }

    const expectedNumbers = new Set(
      Array.from({ length: count }, (_, index) => index + 1),
    );
    const questionNumbers = new Set(
      assessment.questions.map((question) => question.question_number),
    );
    const answerNumbers = new Set(
      assessment.answers.map((answer) => answer.question_number),
    );
    const explanationNumbers = new Set(
      assessment.explanations.map((entry) => entry.question_number),
    );
    const hasExpectedNumbers = (actual: Set<number>) =>
      actual.size === count &&
      [...expectedNumbers].every((number) => actual.has(number));

    if (
      !hasExpectedNumbers(questionNumbers) ||
      !hasExpectedNumbers(answerNumbers) ||
      !hasExpectedNumbers(explanationNumbers)
    ) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question numbers must be unique and align across questions, answers, and explanations",
      });
      return;
    }

    const answersByNumber = new Map(
      assessment.answers.map((answer) => [answer.question_number, answer]),
    );
    const typeCounts = new Map(
      questionTypeSchema.options.map((type) => [type, 0]),
    );

    for (const question of assessment.questions) {
      typeCounts.set(question.type, (typeCounts.get(question.type) ?? 0) + 1);
      const answer = answersByNumber.get(question.question_number);
      if (!answer || answer.type !== question.type) {
        context.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Answer type must match question ${question.question_number}`,
        });
        continue;
      }

      if (
        question.type === "MCQ" &&
        answer.type === "MCQ" &&
        !question.choices.includes(answer.correct_answer)
      ) {
        context.addIssue({
          code: "custom",
          path: ["answers"],
          message: `MCQ answer must exactly match one of the choices for question ${question.question_number}`,
        });
      }

      if (question.type === "MATCHING" && answer.type === "MATCHING") {
        const answerLeft = answer.correct_pairs.map((pair) => pair.left);
        const answerRight = answer.correct_pairs.map((pair) => pair.right);
        if (
          answerLeft.length !== question.left_items.length ||
          new Set(answerLeft).size !== answerLeft.length ||
          answerLeft.some((item) => !question.left_items.includes(item)) ||
          answerRight.length !== question.right_items.length ||
          new Set(answerRight).size !== answerRight.length ||
          answerRight.some((item) => !question.right_items.includes(item))
        ) {
          context.addIssue({
            code: "custom",
            path: ["answers"],
            message: `Matching answer must pair each left item with one valid right item for question ${question.question_number}`,
          });
        }
      }

      if (
        question.type === "SHORT_ANSWER" &&
        answer.type === "SHORT_ANSWER" &&
        answer.rubric.reduce((total, item) => total + item.points, 0) >
          question.max_points
      ) {
        context.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Rubric points cannot exceed max_points for question ${question.question_number}`,
        });
      }
    }

    const counts = [...typeCounts.values()];
    if (Math.max(...counts) - Math.min(...counts) > 1) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question formats must be balanced across the five requested types",
      });
    }

    const scores = assessment.questions.map((question) => question.difficulty_score);
    const averageScore =
      scores.reduce((total, score) => total + score, 0) / scores.length;
    if (Math.abs(averageScore - assessment.difficulty_score) > 0.5) {
      context.addIssue({
        code: "custom",
        path: ["difficulty_score"],
        message: "Overall difficulty_score must match the average question difficulty",
      });
    }

    const targetScore = {
      EASY: 2,
      MEDIUM: 3,
      HARD: 4,
    }[assessment.quiz.target_difficulty];
    if (Math.abs(averageScore - targetScore) > 0.8) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question difficulties must be balanced around the requested difficulty",
      });
    }

  });

export type GenerateAssessmentInput = z.infer<
  typeof generateAssessmentRequestSchema
>;
export type GeneratedAssessment = z.infer<typeof generatedAssessmentSchema>;
