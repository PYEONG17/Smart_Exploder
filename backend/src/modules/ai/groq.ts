import Groq from "groq-sdk";
import { AppError } from "../../utils/app-error.js";

let _client: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError(
      "GROQ_API_KEY chưa được cấu hình trên server. Vui lòng thêm vào file .env.",
      503,
    );
  }
  if (!_client) {
    _client = new Groq({ apiKey });
  }
  return _client;
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
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
    "Groq request failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  if (status === 429) {
    return new AppError(
      "AI đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
      429,
    );
  }
  return new AppError(fallback, 502);
}

export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Send a chat request to Groq and return the assistant's reply as plain text.
 */
export async function chatWithGroq(
  messages: GroqChatMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {},
): Promise<string> {
  const client = getGroqClient();
  try {
    const response = await client.chat.completions.create({
      model: options.model || getGroqModel(),
      messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.6,
      stream: false,
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new AppError(
        "AI trả về phản hồi trống. Vui lòng thử lại.",
        502,
      );
    }
    return reply;
  } catch (error) {
    throw toAppError(
      error,
      "Trợ lý AI đang gặp sự cố. Vui lòng thử lại sau.",
    );
  }
}
