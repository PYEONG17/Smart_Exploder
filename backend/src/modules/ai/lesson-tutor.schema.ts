import { z } from "zod";

export const lessonTutorRequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(2000),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(12000),
        }),
      )
      .max(20)
      .default([]),
    context: z
      .object({
        grade: z.string().trim().max(40).nullish(),
        subject: z.string().trim().max(100).nullish(),
        lessonTitle: z.string().trim().max(200).nullish(),
        lessonDescription: z.string().trim().max(5000).nullish(),
        lessonId: z.string().trim().max(64).nullish(),
        locale: z.enum(["vi", "en"]).optional(),
      })
      .optional(),
  })
  .superRefine((input, ctx) => {
    const totalChars =
      input.prompt.length +
      input.history.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalChars > 12000) {
      ctx.addIssue({
        code: "custom",
        path: ["history"],
        message: "Conversation is too long",
      });
    }

    input.history.forEach((msg, index) => {
      const expectedRole = index % 2 === 0 ? "user" : "assistant";
      if (msg.role !== expectedRole) {
        ctx.addIssue({
          code: "custom",
          path: ["history", index, "role"],
          message:
            "Conversation messages must alternate between user and assistant",
        });
      }
    });
  });
