"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TutorAnswer } from "@/components/ai/TutorAnswer";
import { sendChatMessage, submitInteractiveEventResponse } from "@/lib/api";
import type { InteractiveActivity } from "@/types";
import type { InteractiveEventResponse } from "@/lib/api";
import { useInteractiveVideoStore } from "@/stores/interactiveVideoStore";

type EventResult = {
  isCorrect: boolean | null;
  score: number | null;
  explanation: string | null;
  explanationEn: string | null;
};

const TILE_STYLES = [
  { bg: "bg-red-500 border-red-700", shape: "▲" },
  { bg: "bg-blue-500 border-blue-700", shape: "◆" },
  { bg: "bg-amber-500 border-amber-700", shape: "●" },
  { bg: "bg-emerald-500 border-emerald-700", shape: "■" },
];

function elapsedSince(startedAt: number | null | undefined) {
  const now = Date.now();
  return Math.max(0, now - (startedAt ?? now));
}

type LabelledItem = { id: string; label: string; labelEn?: string };

function labelledItems(value: unknown): LabelledItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is LabelledItem =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      typeof item.id === "string" &&
      "label" in item &&
      typeof item.label === "string",
  );
}

function stringOptions(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function InteractiveEventOverlay({
  activity,
  videoId,
  token,
  isVietnamese,
  lessonTitle,
  grade,
  subject,
  onContinue,
  onRewind,
}: {
  activity: InteractiveActivity;
  videoId: string;
  token: string | null;
  isVietnamese: boolean;
  lessonTitle: string;
  grade?: string;
  subject?: string;
  onContinue: (result: EventResult) => void;
  onRewind?: (activity: InteractiveActivity) => void;
}) {
  const eventPhase = useInteractiveVideoStore((state) => state.phase);
  const eventStartedAt = useInteractiveVideoStore((state) => state.eventStartedAt);
  const setPhase = useInteractiveVideoStore((state) => state.setPhase);
  const recordWrongAttempt = useInteractiveVideoStore(
    (state) => state.recordWrongAttempt,
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [blankValues, setBlankValues] = useState<Record<string, string>>({});
  const [selectedPollOptions, setSelectedPollOptions] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [result, setResult] = useState<EventResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientEventId = useRef<string | null>(null);

  const content = activity.content;
  const prompt = isVietnamese
    ? content.prompt || content.question || content.text || ""
    : content.promptEn ||
      content.questionEn ||
      content.textEn ||
      content.prompt ||
      content.question ||
      content.text ||
      "";
  const options = stringOptions(content.options);
  const items = labelledItems(content.items);
  const zones = labelledItems(content.zones);
  const leftItems = labelledItems(content.leftItems);
  const rightItems = labelledItems(content.rightItems);
  const blanks = Array.isArray(content.blanks) ? content.blanks : [];
  const informational = [
    "EXPLANATION",
    "VOCABULARY",
    "AI_EXPLANATION",
  ].includes(activity.type);
  const aiPrompt = isVietnamese
    ? content.prompt || content.context || ""
    : content.promptEn || content.contextEn || content.prompt || "";

  useEffect(() => {
    if (activity.type !== "AI_EXPLANATION") return;
    if (!token) return;

    let isActive = true;
    sendChatMessage(
      token,
      aiPrompt,
      [],
      {
        grade,
        subject,
        lessonTitle,
        locale: isVietnamese ? "vi" : "en",
      },
    )
      .then((reply) => {
        if (isActive) setAiExplanation(reply);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setAiError(
            error instanceof Error
              ? error.message
              : isVietnamese
                ? "Không thể tải phần giải thích AI."
                : "Could not load the AI explanation.",
          );
        }
      });
    return () => {
      isActive = false;
    };
  }, [
    activity.id,
    activity.type,
    aiPrompt,
    grade,
    isVietnamese,
    lessonTitle,
    subject,
    token,
  ]);

  const updateAssignment = (itemId: string, zoneId: string) =>
    setAssignments((current) => ({ ...current, [itemId]: zoneId }));

  const updatePair = (leftId: string, rightId: string) =>
    setPairs((current) => ({ ...current, [leftId]: rightId }));

  const togglePollOption = (optionId: string) => {
    setSelectedPollOptions((current) => {
      if (content.allowMultiple !== true) return [optionId];
      return current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
    });
  };

  function buildResponse(): InteractiveEventResponse | null {
    switch (activity.type) {
      case "QUESTION":
      case "QUIZ":
        return selectedIndex === null
          ? null
          : { type: activity.type, selectedIndex };
      case "DRAG_DROP":
        return Object.keys(assignments).length === items.length && items.length
          ? { type: "DRAG_DROP", assignments }
          : null;
      case "MATCHING":
        return Object.keys(pairs).length === leftItems.length && leftItems.length
          ? { type: "MATCHING", pairs }
          : null;
      case "FILL_BLANK":
        return blanks.length &&
          blanks.every(
            (blank) =>
              typeof blank === "object" &&
              blank !== null &&
              "id" in blank &&
              typeof blank.id === "string" &&
              Boolean(blankValues[blank.id]?.trim()),
          )
          ? { type: "FILL_BLANK", values: blankValues }
          : null;
      case "POLL":
        return selectedPollOptions.length
          ? { type: "POLL", selectedOptionIds: selectedPollOptions }
          : null;
      case "REFLECTION":
        return reflection.trim().length >= (content.minLength ?? 0)
          ? { type: "REFLECTION", text: reflection.trim() }
          : null;
      case "EXPLANATION":
      case "VOCABULARY":
      case "AI_EXPLANATION":
        return { type: activity.type, viewed: true };
      default:
        return null;
    }
  }

  async function handleSubmit(override?: InteractiveEventResponse) {
    if (!token) {
      setAiError(
        isVietnamese
          ? "Đăng nhập để lưu hoạt động học tập."
          : "Sign in to save your learning activity.",
      );
      return;
    }
    const response = override ?? buildResponse();
    if (!response) {
      setAiError(
        isVietnamese
          ? "Hoàn thành tất cả phần trả lời trước khi tiếp tục."
          : "Complete all required responses before continuing.",
      );
      return;
    }

    setIsSubmitting(true);
    setPhase("SUBMITTING");
    if (!clientEventId.current) {
      clientEventId.current = crypto.randomUUID();
    }
    try {
      const saved = await submitInteractiveEventResponse(
        token,
        videoId,
        activity.id,
        {
          clientEventId: clientEventId.current,
          durationMs: elapsedSince(eventStartedAt),
          response,
        },
      );
      const nextResult = {
        isCorrect: saved.isCorrect,
        score: saved.score,
        explanation: saved.explanation,
        explanationEn: saved.explanationEn,
      };
      setResult(nextResult);
      if (nextResult.isCorrect === false) recordWrongAttempt(activity.id);
      setPhase("FEEDBACK");
      clientEventId.current = null;
    } catch (error) {
      setPhase("EVENT_ACTIVE");
      setAiError(
        error instanceof Error
          ? error.message
          : isVietnamese
            ? "Không thể lưu câu trả lời."
            : "Could not save your response.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleContinue = () => {
    if (!result) return;
    onContinue(result);
  };

  const answeredWrong = result?.isCorrect === false;
  const canRewind = onRewind !== undefined && content.rewindSeconds !== 0;

  const handleRetry = () => {
    setResult(null);
    setAiError(null);
    setSelectedIndex(null);
    setAssignments({});
    setPairs({});
    setBlankValues({});
    setSelectedPollOptions([]);
    setReflection("");
    clientEventId.current = null;
    setPhase("EVENT_ACTIVE");
  };

  const displayLabel = (item: LabelledItem) =>
    !isVietnamese && item.labelEn ? item.labelEn : item.label;
  const busy = isSubmitting || eventPhase === "SUBMITTING";
  const visibleAiError =
    aiError ??
    (activity.type === "AI_EXPLANATION" && !token
      ? isVietnamese
        ? "Đăng nhập để nhận giải thích từ AI."
        : "Sign in to get an AI explanation."
      : null);
  const aiLoading =
    activity.type === "AI_EXPLANATION" &&
    Boolean(token) &&
    !aiExplanation &&
    !visibleAiError;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`interactive-event-${activity.id}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.preventDefault();
      }}
    >
      <section className="my-auto max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-2xl sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
          {activity.type.replaceAll("_", " ")} ·{" "}
          {Math.floor((activity.timestampMs ?? activity.timestamp * 1000) / 1000)}s
        </p>
        <h2
          id={`interactive-event-${activity.id}`}
          className="mb-4 text-lg font-semibold text-foreground"
        >
          {prompt}
        </h2>

        {activity.type === "QUESTION" || activity.type === "QUIZ" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option, index) => {
              const style = TILE_STYLES[index % TILE_STYLES.length];
              const isChosen = selectedIndex === index;
              const dimmed = (!!result || busy) && !isChosen;
              const mark =
                result && isChosen && result.isCorrect !== null
                  ? result.isCorrect
                    ? "✓"
                    : "✗"
                  : null;
              return (
                <button
                  key={`${activity.id}-${index}`}
                  type="button"
                  disabled={!!result || busy}
                  onClick={() => {
                    setSelectedIndex(index);
                    setAiError(null);
                    void handleSubmit({
                      type: activity.type === "QUIZ" ? "QUIZ" : "QUESTION",
                      selectedIndex: index,
                    });
                  }}
                  className={`relative flex min-h-16 items-center gap-3 rounded-xl border-b-4 px-4 py-3 text-left text-sm font-semibold text-white shadow-md transition active:translate-y-0.5 active:border-b-2 ${style.bg} ${
                    dimmed ? "opacity-40" : "hover:brightness-110"
                  } ${isChosen ? "ring-4 ring-white/70" : ""}`}
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    {style.shape}
                  </span>
                  <span className="flex-1">
                    {isVietnamese ? option : content.optionsEn?.[index] || option}
                  </span>
                  {mark && (
                    <span
                      className={`flex size-7 items-center justify-center rounded-full bg-white text-base font-bold ${
                        result?.isCorrect ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {mark}
                    </span>
                  )}
                  {busy && isChosen && (
                    <LoaderCircle className="size-5 animate-spin" />
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
        {activity.type === "DRAG_DROP" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isVietnamese
                ? "Kéo mỗi thẻ vào vùng phù hợp hoặc dùng danh sách chọn."
                : "Drag each card to a zone or use the accessible selectors."}
            </p>
            {items.map((item) => (
              <div
                key={item.id}
                draggable={!result && !busy}
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", item.id)
                }
                className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr]"
              >
                <span className="cursor-grab self-center text-sm">
                  {displayLabel(item)}
                </span>
                <select
                  aria-label={`${displayLabel(item)} ${isVietnamese ? "vùng đích" : "target zone"}`}
                  value={assignments[item.id] ?? ""}
                  disabled={!!result || busy}
                  onChange={(event) => updateAssignment(item.id, event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value="">
                    {isVietnamese ? "Chọn vùng" : "Choose a zone"}
                  </option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {displayLabel(zone)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {zones.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Drop zones">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const itemId = event.dataTransfer.getData("text/plain");
                      if (items.some((item) => item.id === itemId)) {
                        updateAssignment(itemId, zone.id);
                      }
                    }}
                    className="rounded-lg border border-dashed border-blue-500/60 bg-blue-500/5 px-3 py-2 text-xs"
                  >
                    {displayLabel(zone)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activity.type === "MATCHING" && (
          <div className="space-y-3">
            {leftItems.map((item) => (
              <label
                key={item.id}
                className="grid gap-2 text-sm sm:grid-cols-[1fr_1fr]"
              >
                <span className="self-center">{displayLabel(item)}</span>
                <select
                  value={pairs[item.id] ?? ""}
                  disabled={!!result || busy}
                  onChange={(event) => updatePair(item.id, event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-2"
                >
                  <option value="">
                    {isVietnamese ? "Chọn cặp phù hợp" : "Choose a match"}
                  </option>
                  {rightItems.map((right) => (
                    <option key={right.id} value={right.id}>
                      {displayLabel(right)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}

        {activity.type === "FILL_BLANK" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isVietnamese
                ? "Điền một câu trả lời cho mỗi chỗ trống."
                : "Enter one response for each blank."}
            </p>
            {blanks.map((blank, index) => {
              if (
                typeof blank !== "object" ||
                blank === null ||
                !("id" in blank) ||
                typeof blank.id !== "string"
              ) {
                return null;
              }
              return (
                <label key={blank.id} className="grid gap-1 text-sm">
                  <span>
                    {isVietnamese ? "Chỗ trống" : "Blank"} {index + 1}
                  </span>
                  <input
                    value={blankValues[blank.id] ?? ""}
                    disabled={!!result || busy}
                    maxLength={150}
                    onChange={(event) =>
                      setBlankValues((current) => ({
                        ...current,
                        [blank.id]: event.target.value,
                      }))
                    }
                    className="h-10 rounded-md border border-border bg-background px-3"
                  />
                </label>
              );
            })}
          </div>
        )}

        {activity.type === "POLL" && (
          <div className="space-y-2">
            {labelledItems(content.options).map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <input
                  type={content.allowMultiple ? "checkbox" : "radio"}
                  name={`poll-${activity.id}`}
                  checked={selectedPollOptions.includes(option.id)}
                  disabled={!!result || busy}
                  onChange={() => togglePollOption(option.id)}
                />
                {displayLabel(option)}
              </label>
            ))}
          </div>
        )}

        {activity.type === "REFLECTION" && (
          <div className="space-y-2">
            {(isVietnamese
              ? content.dataNotice
              : content.dataNoticeEn || content.dataNotice) && (
              <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                {isVietnamese
                  ? content.dataNotice
                  : content.dataNoticeEn || content.dataNotice}
              </p>
            )}
            <textarea
              value={reflection}
              disabled={!!result || busy}
              maxLength={content.maxLength ?? 1000}
              rows={5}
              onChange={(event) => setReflection(event.target.value)}
              aria-label={isVietnamese ? "Câu trả lời suy ngẫm" : "Reflection"}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm"
            />
            <p className="text-right text-xs text-muted-foreground">
              {reflection.length}/{content.maxLength ?? 1000}
            </p>
          </div>
        )}

        {activity.type === "VOCABULARY" && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            {content.termEn && (
              <p className="text-sm text-muted-foreground">
                {isVietnamese ? content.termEn : content.term}
                {content.pronunciation ? ` · ${content.pronunciation}` : ""}
              </p>
            )}
            <p className="text-sm">
              {isVietnamese
                ? content.definition || ""
                : content.definitionEn || content.definition || ""}
            </p>
            {(content.example || content.exampleEn) && (
              <p className="border-l-2 border-blue-500 pl-3 text-sm italic text-muted-foreground">
                {isVietnamese
                  ? content.example
                  : content.exampleEn || content.example}
              </p>
            )}
          </div>
        )}

        {activity.type === "AI_EXPLANATION" && (
          <div className="min-h-24 rounded-lg bg-muted/50 p-4 text-sm leading-6">
            {aiLoading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                {isVietnamese ? "AI đang giải thích..." : "AI is explaining..."}
              </span>
            ) : visibleAiError ? (
              <p role="alert" className="text-destructive">
                {visibleAiError}
              </p>
            ) : (
              <TutorAnswer content={aiExplanation} compact />
            )}
          </div>
        )}

        {activity.type === "EXPLANATION" && (
          <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-6">
            {prompt}
          </p>
        )}

        {result && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm font-medium ${
              result.isCorrect === true
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : result.isCorrect === false
                  ? "bg-red-500/15 text-red-700 dark:text-red-300"
                  : "bg-muted/50"
            }`}
            role="status"
          >
            {result.isCorrect === null
              ? isVietnamese
                ? "Đã ghi nhận hoạt động."
                : "Response recorded."
              : result.isCorrect
                ? isVietnamese
                  ? "🎉 Chính xác!"
                  : "🎉 Correct!"
                : isVietnamese
                  ? "Chưa đúng. Bạn có thể làm lại câu hỏi hoặc xem lại đoạn video."
                  : "Not quite. Try the question again or rewatch the video."}
            {(isVietnamese
              ? result.explanation
              : result.explanationEn || result.explanation) && (
              <p className="mt-2 text-muted-foreground">
                {isVietnamese
                  ? result.explanation
                  : result.explanationEn || result.explanation}
              </p>
            )}
          </div>
        )}

        {aiError && activity.type !== "AI_EXPLANATION" && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {aiError}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          {result && answeredWrong ? (
            <>
              {canRewind && (
                <Button variant="outline" onClick={() => onRewind?.(activity)}>
                  {isVietnamese ? "Xem lại đoạn video" : "Rewatch video"}
                </Button>
              )}
              <Button onClick={handleRetry}>
                {isVietnamese ? "Làm lại" : "Try again"}
              </Button>
            </>
          ) : result ? (
            <Button onClick={handleContinue}>
              {isVietnamese ? "Tiếp tục video" : "Continue video"}
            </Button>
          ) : activity.type === "QUESTION" || activity.type === "QUIZ" ? null : (
            <Button
              onClick={() => void handleSubmit()}
              disabled={busy || aiLoading}
              className="gap-2"
            >
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {informational && <Sparkles className="size-4" />}
              {busy
                ? isVietnamese
                  ? "Đang lưu..."
                  : "Saving..."
                : informational
                  ? isVietnamese
                    ? "Đã xem, tiếp tục"
                    : "Mark viewed & continue"
                  : isVietnamese
                    ? "Gửi câu trả lời"
                    : "Submit response"}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
