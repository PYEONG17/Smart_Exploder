import { z } from "zod";

export const submitQuizSchema = z.object({
  answers: z
    .record(z.string(), z.string())
    .refine((answers) => Object.keys(answers).length > 0),
});

export const checkQuizAnswerSchema = z.object({
  answerId: z.string().min(1),
});

export const saveProgressSchema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED"]),
});

const answerSchema = z.object({
  content: z.string().trim().min(1).max(500),
  contentEn: z.string().trim().max(500).optional(),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  question: z.string().trim().min(2).max(2000),
  questionEn: z.string().trim().max(2000).optional(),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"]),
  answers: z
    .array(answerSchema)
    .min(2)
    .max(6)
    .refine(
      (answers) => answers.filter((answer) => answer.isCorrect).length === 1,
      "Each question must have exactly one correct answer",
    ),
});

export const createLessonQuizSchema = z.object({
  title: z.string().trim().max(150).optional(),
  titleEn: z.string().trim().max(150).optional(),
  sourceLanguage: z.enum(["vi", "en"]).optional(),
  questions: z.array(questionSchema).min(1).max(40),
});

// rewindSeconds: how far back "rewatch" jumps (0 hides it); skipAfterAttempts: wrong tries before skipping is allowed.
const retryPolicyFields = {
  rewindSeconds: z.number().int().min(0).max(3600).optional(),
  skipAfterAttempts: z.number().int().min(1).max(10).optional(),
};

const legacyQuestionContentSchema = z.object({
  ...retryPolicyFields,
  question: z.string().trim().min(2).max(1000),
  questionEn: z.string().trim().max(1000).optional(),
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  optionsEn: z.array(z.string().trim().max(300)).min(2).max(6).optional(),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().trim().max(2000).optional(),
  explanationEn: z.string().trim().max(2000).optional(),
});

const interactiveEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["QUESTION", "QUIZ"]),
    content: legacyQuestionContentSchema,
  }),
  z.object({
    type: z.literal("EXPLANATION"),
    content: z.object({
      text: z.string().trim().min(1).max(2000),
      textEn: z.string().trim().max(2000).optional(),
    }),
  }),
  z.object({
    type: z.literal("DRAG_DROP"),
    content: z.object({
      ...retryPolicyFields,
      prompt: z.string().trim().min(2).max(1000),
      items: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(40),
            label: z.string().trim().min(1).max(200),
            labelEn: z.string().trim().max(200).optional(),
            targetZoneId: z.string().trim().min(1).max(40),
          }),
        )
        .min(2)
        .max(12),
      zones: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(40),
            label: z.string().trim().min(1).max(200),
            labelEn: z.string().trim().max(200).optional(),
          }),
        )
        .min(2)
        .max(8),
      explanation: z.string().trim().max(2000).optional(),
      explanationEn: z.string().trim().max(2000).optional(),
    }),
  }),
  z.object({
    type: z.literal("MATCHING"),
    content: z.object({
      ...retryPolicyFields,
      prompt: z.string().trim().min(2).max(1000),
      leftItems: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(40),
            label: z.string().trim().min(1).max(200),
            labelEn: z.string().trim().max(200).optional(),
          }),
        )
        .min(2)
        .max(8),
      rightItems: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(40),
            label: z.string().trim().min(1).max(200),
            labelEn: z.string().trim().max(200).optional(),
          }),
        )
        .min(2)
        .max(8),
      correctPairs: z
        .array(
          z.object({
            leftId: z.string().trim().min(1).max(40),
            rightId: z.string().trim().min(1).max(40),
          }),
        )
        .min(2)
        .max(8),
      explanation: z.string().trim().max(2000).optional(),
      explanationEn: z.string().trim().max(2000).optional(),
    }),
  }),
  z.object({
    type: z.literal("FILL_BLANK"),
    content: z.object({
      ...retryPolicyFields,
      prompt: z.string().trim().min(2).max(1000),
      blanks: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(40),
            acceptedAnswers: z
              .array(z.string().trim().min(1).max(150))
              .min(1)
              .max(8),
          }),
        )
        .min(1)
        .max(8),
      explanation: z.string().trim().max(2000).optional(),
      explanationEn: z.string().trim().max(2000).optional(),
    }),
  }),
  z.object({
    type: z.literal("POLL"),
    content: z.object({
      prompt: z.string().trim().min(2).max(1000),
      options: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(40),
            label: z.string().trim().min(1).max(300),
            labelEn: z.string().trim().max(300).optional(),
          }),
        )
        .min(2)
        .max(8),
      allowMultiple: z.boolean().default(false),
    }),
  }),
  z.object({
    type: z.literal("REFLECTION"),
    content: z.object({
      prompt: z.string().trim().min(2).max(1000),
      minLength: z.number().int().min(0).max(500).default(0),
      maxLength: z.number().int().min(20).max(2000).default(1000),
      dataNotice: z.string().trim().max(500).optional(),
      dataNoticeEn: z.string().trim().max(500).optional(),
    }),
  }),
  z.object({
    type: z.literal("VOCABULARY"),
    content: z.object({
      term: z.string().trim().min(1).max(160),
      termEn: z.string().trim().max(160).optional(),
      pronunciation: z.string().trim().max(160).optional(),
      definition: z.string().trim().min(1).max(1200),
      definitionEn: z.string().trim().max(1200).optional(),
      example: z.string().trim().max(800).optional(),
      exampleEn: z.string().trim().max(800).optional(),
    }),
  }),
  z.object({
    type: z.literal("AI_EXPLANATION"),
    content: z.object({
      prompt: z.string().trim().min(2).max(1000),
      promptEn: z.string().trim().max(1000).optional(),
      context: z.string().trim().max(2000).optional(),
      contextEn: z.string().trim().max(2000).optional(),
    }),
  }),
]).superRefine((event, context) => {
  if (event.type === "QUESTION" || event.type === "QUIZ") {
    if (
      event.content.correctIndex >= event.content.options.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["content", "correctIndex"],
        message: "Correct answer must match an available option",
      });
    }
    if (
      event.content.optionsEn &&
      event.content.optionsEn.length !== event.content.options.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["content", "optionsEn"],
        message: "Vietnamese and English options must have the same count",
      });
    }
  }
  if (event.type === "DRAG_DROP") {
    const itemIds = event.content.items.map((item) => item.id);
    const zoneIds = event.content.zones.map((zone) => zone.id);
    if (
      new Set(itemIds).size !== itemIds.length ||
      new Set(zoneIds).size !== zoneIds.length ||
      event.content.items.some((item) => !zoneIds.includes(item.targetZoneId))
    ) {
      context.addIssue({
        code: "custom",
        path: ["content"],
        message: "Drag-drop IDs must be unique and each target zone must exist",
      });
    }
  }
  if (event.type === "MATCHING") {
    const leftIds = event.content.leftItems.map((item) => item.id);
    const rightIds = event.content.rightItems.map((item) => item.id);
    const pairLeftIds = event.content.correctPairs.map((pair) => pair.leftId);
    const pairRightIds = event.content.correctPairs.map((pair) => pair.rightId);
    if (
      new Set(leftIds).size !== leftIds.length ||
      new Set(rightIds).size !== rightIds.length ||
      pairLeftIds.length !== leftIds.length ||
      new Set(pairLeftIds).size !== pairLeftIds.length ||
      pairLeftIds.some((id) => !leftIds.includes(id)) ||
      pairRightIds.some((id) => !rightIds.includes(id))
    ) {
      context.addIssue({
        code: "custom",
        path: ["content", "correctPairs"],
        message: "Matching requires one valid pair for every left item",
      });
    }
  }
  if (event.type === "FILL_BLANK") {
    const blankIds = event.content.blanks.map((blank) => blank.id);
    if (new Set(blankIds).size !== blankIds.length) {
      context.addIssue({
        code: "custom",
        path: ["content", "blanks"],
        message: "Blank IDs must be unique",
      });
    }
  }
  if (event.type === "POLL") {
    const optionIds = event.content.options.map((option) => option.id);
    if (new Set(optionIds).size !== optionIds.length) {
      context.addIssue({
        code: "custom",
        path: ["content", "options"],
        message: "Poll option IDs must be unique",
      });
    }
  }
  if (
    event.type === "REFLECTION" &&
    event.content.minLength > event.content.maxLength
  ) {
    context.addIssue({
      code: "custom",
      path: ["content", "minLength"],
      message: "Minimum reflection length must not exceed maximum length",
    });
  }
});

export const videoActivitySchema = z
  .object({
    timestamp: z.number().int().nonnegative().optional(),
    timestampMs: z.number().int().nonnegative().optional(),
    sourceLanguage: z.enum(["vi", "en"]).optional(),
  })
  .and(interactiveEventSchema)
  .refine(
    (activity) =>
      activity.timestamp !== undefined || activity.timestampMs !== undefined,
    "Each activity requires timestamp or timestampMs",
  );

export type VideoActivityInput = z.infer<typeof videoActivitySchema>;

export const createLessonVideoSchema = z
  .object({
    title: z.string().trim().max(150).optional(),
    titleEn: z.string().trim().max(150).optional(),
    sourceLanguage: z.enum(["vi", "en"]).optional(),
    url: z.string().trim().url().max(2000),
    activities: z.array(videoActivitySchema).max(20).optional(),
  })
  .superRefine((input, context) => {
    if (input.activities?.length) {
      const host = new URL(input.url).hostname.replace(/^www\./, "");
      if (["youtube.com", "m.youtube.com", "youtu.be"].includes(host)) {
        context.addIssue({
          code: "custom",
          path: ["url"],
          message: "Interactive checkpoints require a direct video file URL",
        });
      }
    }

    const timestamps = input.activities?.map((activity) =>
      activity.timestampMs ?? (activity.timestamp ?? 0) * 1000,
    );
    if (timestamps && new Set(timestamps).size !== timestamps.length) {
      context.addIssue({
        code: "custom",
        path: ["activities"],
        message: "Each event must have a unique timestamp",
      });
    }
    input.activities?.forEach((activity, index) => {
      if (
        activity.timestampMs !== undefined &&
        activity.timestamp !== undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["activities", index],
          message: "Use timestampMs or legacy timestamp, not both",
        });
      }
    });
  });

export const submitVideoActivitySchema = z.object({
  selectedIndex: z.number().int().nonnegative(),
});

const eventResponseBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["QUESTION", "QUIZ"]),
    selectedIndex: z.number().int().nonnegative(),
  }).strict(),
  z.object({
    type: z.literal("DRAG_DROP"),
    assignments: z.record(z.string(), z.string()),
  }).strict(),
  z.object({
    type: z.literal("MATCHING"),
    pairs: z.record(z.string(), z.string()),
  }).strict(),
  z.object({
    type: z.literal("FILL_BLANK"),
    values: z.record(z.string(), z.string()),
  }).strict(),
  z.object({
    type: z.literal("POLL"),
    selectedOptionIds: z.array(z.string().min(1).max(40)).min(1).max(8),
  }).strict(),
  z.object({
    type: z.literal("REFLECTION"),
    text: z.string().trim().min(1).max(2000),
  }).strict(),
  z.object({
    type: z.enum(["EXPLANATION", "VOCABULARY", "AI_EXPLANATION"]),
    viewed: z.literal(true),
  }).strict(),
]);

export const submitInteractiveEventSchema = z.object({
  clientEventId: z.string().uuid(),
  durationMs: z.number().int().min(0).max(30 * 60 * 1000),
  response: eventResponseBodySchema,
}).strict();

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type SaveProgressInput = z.infer<typeof saveProgressSchema>;
export type CreateLessonQuizInput = z.infer<typeof createLessonQuizSchema>;
export type CreateLessonVideoInput = z.infer<typeof createLessonVideoSchema>;
export type SubmitVideoActivityInput = z.infer<
  typeof submitVideoActivitySchema
>;
export type SubmitInteractiveEventInput = z.infer<
  typeof submitInteractiveEventSchema
>;
