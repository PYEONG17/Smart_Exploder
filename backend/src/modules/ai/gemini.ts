import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";
import { AppError } from "../../utils/app-error.js";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("Gemini AI is not configured on the server", 503);
  }
  return new GoogleGenAI({ apiKey });
}

function getModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
}

function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : undefined;
  console.error(
    "Gemini request failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  return status === 429
    ? new AppError(
        "AI đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
        429,
      )
    : new AppError(fallback, 502);
}

export async function generateGeminiJson<T>(
  prompt: string,
  schema: ZodType<T>,
  options: { maxOutputTokens?: number; temperature?: number } = {},
): Promise<T> {
  const ai = getClient();
  try {
    const result = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxOutputTokens ?? 6000,
      },
    });
    const text = result.text?.trim();
    let decoded: unknown;
    try {
      decoded = text ? JSON.parse(text) : null;
    } catch {
      decoded = null;
    }
    const parsed = schema.safeParse(decoded);
    if (!parsed.success) {
      console.error("Gemini output failed validation:", parsed.error.issues);
      throw new AppError(
        "AI trả về nội dung chưa đúng định dạng. Vui lòng thử lại.",
        502,
      );
    }
    return parsed.data;
  } catch (error) {
    throw toAppError(error, "Trợ lý AI đang gặp sự cố. Vui lòng thử lại sau.");
  }
}

export type GroundedAnswer = {
  text: string;
  sources: { title: string; url: string }[];
};

// Uses Gemini's built-in Google Search grounding to find real web sources.
export async function generateGroundedText(
  prompt: string,
): Promise<GroundedAnswer> {
  const ai = getClient();
  try {
    const result = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
        maxOutputTokens: 2500,
      },
    });
    const seen = new Set<string>();
    const sources: GroundedAnswer["sources"] = [];
    for (const chunk of result.candidates?.[0]?.groundingMetadata
      ?.groundingChunks ?? []) {
      const url = chunk.web?.uri;
      if (!url || seen.has(url) || !URL.canParse(url)) continue;
      seen.add(url);
      sources.push({ title: chunk.web?.title?.trim() || url, url });
    }
    return { text: result.text?.trim() ?? "", sources: sources.slice(0, 8) };
  } catch (error) {
    throw toAppError(error, "Không thể tìm tài liệu lúc này. Vui lòng thử lại sau.");
  }
}

export type GeminiChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export async function chatWithGeminiText(
  systemInstruction: string,
  history: GeminiChatMessage[],
  options: { maxOutputTokens?: number; temperature?: number; model?: string } = {},
): Promise<string> {
  const ai = getClient();
  try {
    const result = await ai.models.generateContent({
      model: options.model || getModel(),
      contents: history,
      config: {
        systemInstruction,
        temperature: options.temperature ?? 0.6,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
      },
    });
    const reply = result.text?.trim();
    if (!reply) {
      throw new AppError("AI trả về phản hồi trống. Vui lòng thử lại.", 502);
    }
    return reply;
  } catch (error) {
    throw toAppError(error, "Trợ lý AI đang gặp sự cố. Vui lòng thử lại sau.");
  }
}
