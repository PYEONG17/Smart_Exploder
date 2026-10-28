import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import { chatWithGroq } from "./groq.js";
import { buildSystemPrompt } from "./lesson-tutor.controller.js";

const createConversationSchema = z.object({
  grade: z.string().trim().max(40).optional(),
  locale: z.enum(["vi", "en"]).default("vi"),
});

const sendMessageSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  grade: z.string().trim().max(40).optional(),
  locale: z.enum(["vi", "en"]).default("vi"),
});

function authenticatedUserId(req: Request): string {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user.id;
}

export async function listAiConversations(req: Request, res: Response) {
  const userId = authenticatedUserId(req);
  const conversations = await prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      grade: true,
      locale: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { content: true, role: true },
      },
    },
  });
  res.json(success(conversations));
}

export async function createAiConversation(req: Request, res: Response) {
  const userId = authenticatedUserId(req);
  const input = createConversationSchema.parse(req.body);
  const data = await prisma.aIConversation.create({
    data: {
      userId,
      title: input.locale === "vi" ? "Đoạn chat mới" : "New chat",
      grade: input.grade,
      locale: input.locale,
    },
  });
  res.status(201).json(success(data, "Conversation created"));
}

export async function getAiConversation(req: Request, res: Response) {
  const conversation = await prisma.aIConversation.findFirst({
    where: {
      id: String(req.params.id),
      userId: authenticatedUserId(req),
    },
    select: {
      id: true,
      title: true,
      grade: true,
      locale: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });
  if (!conversation) throw new AppError("Conversation not found", 404);
  res.json(success(conversation));
}

export async function sendAiConversationMessage(req: Request, res: Response) {
  const userId = authenticatedUserId(req);
  const input = sendMessageSchema.parse(req.body);
  const conversationId = String(req.params.id);
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
        select: { role: true, content: true },
      },
    },
  });
  if (!conversation) throw new AppError("Conversation not found", 404);

  const isFirstMessage = conversation.messages.length === 0;
  const userMessage = await prisma.aIMessage.create({
    data: {
      conversationId,
      role: "user",
      content: input.prompt,
    },
  });
  const title = isFirstMessage
    ? input.prompt.slice(0, 80)
    : conversation.title;
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: {
      title,
      grade: input.grade ?? conversation.grade,
      locale: input.locale,
      updatedAt: new Date(),
    },
  });

  const previousMessages = conversation.messages
    .reverse()
    .filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        message.role === "user" || message.role === "assistant",
    );
  const priorExchanges: { role: "user" | "assistant"; content: string }[] = [];
  let waitingForAssistant = true;
  for (let index = previousMessages.length - 1; index >= 0; index -= 1) {
    const message = previousMessages[index];
    if (!message) continue;
    if (waitingForAssistant && message.role === "assistant") {
      priorExchanges.unshift(message);
      waitingForAssistant = false;
    } else if (!waitingForAssistant && message.role === "user") {
      priorExchanges.unshift(message);
      waitingForAssistant = true;
    }
  }
  const history = priorExchanges.slice(-10);
  const reply = await chatWithGroq(
    [
      {
        role: "system",
        content: buildSystemPrompt({
          grade: input.grade ?? conversation.grade ?? undefined,
          locale: input.locale,
        }),
      },
      ...history,
      { role: "user", content: input.prompt },
    ],
    { maxTokens: 2048, temperature: 0.6 },
  );

  const assistantMessage = await prisma.aIMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content: reply,
    },
  });
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  res.json(
    success(
      {
        conversation: { id: conversationId, title },
        userMessage,
        assistantMessage,
      },
      "Reply generated",
    ),
  );
}

export async function deleteAiConversation(req: Request, res: Response) {
  const result = await prisma.aIConversation.deleteMany({
    where: {
      id: String(req.params.id),
      userId: authenticatedUserId(req),
    },
  });
  if (result.count === 0) throw new AppError("Conversation not found", 404);
  res.json(success({ id: String(req.params.id) }, "Conversation deleted"));
}
