type TutorMessage = { role: "user" | "assistant"; content: string };

export function buildLessonTutorHistory(
  history: TutorMessage[],
  prompt: string,
): TutorMessage[] {
  const pairs: TutorMessage[][] = [];
  let pendingQuestion: TutorMessage | null = null;
  for (const message of history) {
    if (message.role === "user") {
      pendingQuestion = message;
    } else if (pendingQuestion) {
      pairs.push([pendingQuestion, message]);
      pendingQuestion = null;
    }
  }

  const result: TutorMessage[] = [];
  let remaining = 12000 - prompt.trim().length;
  for (let index = pairs.length - 1; index >= 0 && result.length < 10; index--) {
    const pair = pairs[index];
    const length = pair[0].content.trim().length + pair[1].content.trim().length;
    if (!pair[0].content.trim() || !pair[1].content.trim() || length > remaining) {
      break;
    }
    result.unshift(...pair);
    remaining -= length;
  }
  return result;
}
