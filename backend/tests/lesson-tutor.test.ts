import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { lessonTutorRequestSchema } from "../src/modules/ai/lesson-tutor.schema.js";
import { lessonTutorChat } from "../src/modules/ai/lesson-tutor.controller.js";
import { buildLessonTutorHistory } from "../../frontend/lib/lesson-tutor-history.js";

test("lesson tutor accepts missing descriptions and full-length lesson content", () => {
  for (const lessonDescription of [null, undefined, "a".repeat(5000)]) {
    const result = lessonTutorRequestSchema.safeParse({
      prompt: "Giải thích bài học",
      history: [],
      context: { lessonDescription, locale: "vi" },
    });
    assert.equal(result.success, true);
  }
});

test("lesson tutor accepts a long AI reply in a valid conversation", () => {
  const history = buildLessonTutorHistory(
    [
      { role: "user", content: "Giải thích" },
      { role: "assistant", content: "a".repeat(4000) },
    ],
    "Cho ví dụ",
  );
  assert.equal(history.length, 2);
  assert.equal(
    lessonTutorRequestSchema.safeParse({ prompt: "Cho ví dụ", history }).success,
    true,
  );
});

test("history keeps recent complete turns within the request budget", () => {
  const prompt = "a".repeat(2000);
  const history = buildLessonTutorHistory(
    [
      { role: "assistant", content: "welcome" },
      { role: "user", content: "old" },
      { role: "assistant", content: "x".repeat(6000) },
      { role: "user", content: "new" },
      { role: "assistant", content: "y".repeat(4000) },
      { role: "user", content: "failed" },
    ],
    prompt,
  );
  assert.deepEqual(history.map((message) => message.content.slice(0, 3)), [
    "new",
    "yyy",
  ]);
  assert.equal(lessonTutorRequestSchema.safeParse({ prompt, history }).success, true);
});

test("invalid prompts and non-alternating histories are rejected", () => {
  assert.equal(lessonTutorRequestSchema.safeParse({ prompt: " " }).success, false);
  assert.equal(
    lessonTutorRequestSchema.safeParse({
      prompt: "Hỏi",
      history: [{ role: "assistant", content: "hello" }],
    }).success,
    false,
  );
});

test("lesson tutor returns the provider reply when lesson description is null", async () => {
  const provider = express();
  provider.use(express.json());
  provider.post("/openai/v1/chat/completions", (req, res) => {
    assert.equal(req.body.messages.at(-1).content, "Giải thích bài học");
    res.json({ choices: [{ message: { content: "Đây là câu trả lời." } }] });
  });
  const providerServer = provider.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => providerServer.once("listening", resolve));
  const previousKey = process.env.GROQ_API_KEY;
  const previousBaseUrl = process.env.GROQ_BASE_URL;
  process.env.GROQ_API_KEY = "local-test-key";
  process.env.GROQ_BASE_URL = `http://127.0.0.1:${(providerServer.address() as AddressInfo).port}`;

  const app = express();
  app.use(express.json());
  app.post("/lesson-tutor", lessonTutorChat);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));

  try {
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}/lesson-tutor`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Giải thích bài học",
          context: { lessonDescription: null, locale: "vi" },
        }),
      },
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.reply, "Đây là câu trả lời.");
  } finally {
    server.close();
    providerServer.close();
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
    if (previousBaseUrl === undefined) delete process.env.GROQ_BASE_URL;
    else process.env.GROQ_BASE_URL = previousBaseUrl;
  }
});
