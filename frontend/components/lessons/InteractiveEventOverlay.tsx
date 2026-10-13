"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  HelpCircle,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
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

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function elapsedSince(startedAt: number | null | undefined) {
  const now = Date.now();
  return Math.max(0, now - (startedAt ?? now));
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  const timestampSec = Math.floor(
    (activity.timestampMs ?? activity.timestamp * 1000) / 1000,
  );

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-background/80 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`interactive-event-${activity.id}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.preventDefault();
      }}
    >
      <section className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-2xl transition-all">
        {/* Header Bar */}
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wide">
              {activity.type.replaceAll("_", " ")}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="font-mono">{formatTime(timestampSec)}</span>
          </div>

          {result && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                result.isCorrect
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : result.isCorrect === false
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {result.isCorrect ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isVietnamese ? "Chính xác" : "Correct"}</span>
                </>
              ) : result.isCorrect === false ? (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>{isVietnamese ? "Chưa đúng" : "Incorrect"}</span>
                </>
              ) : (
                <span>{isVietnamese ? "Đã ghi nhận" : "Recorded"}</span>
              )}
            </div>
          )}
        </div>

        {/* Prompt */}
        <h2
          id={`interactive-event-${activity.id}`}
          className="mb-5 text-lg sm:text-xl font-semibold leading-relaxed tracking-tight text-foreground"
        >
          {prompt}
        </h2>

        {/* Multiple Choice (QUESTION / QUIZ) */}
        {activity.type === "QUESTION" || activity.type === "QUIZ" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option, index) => {
              const letter = OPTION_LETTERS[index] || String(index + 1);
              const isChosen = selectedIndex === index;
              const isCorrectAnswer = result?.isCorrect && isChosen;
              const isWrongAnswer = result?.isCorrect === false && isChosen;
              const dimmed = (!!result || busy) && !isChosen;

              let cardStyle =
                "border-border/80 bg-background/50 hover:border-primary/50 hover:bg-muted/40 text-foreground";
              let badgeStyle = "bg-muted text-muted-foreground";

              if (isCorrectAnswer) {
                cardStyle =
                  "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20";
                badgeStyle = "bg-emerald-500 text-white";
              } else if (isWrongAnswer) {
                cardStyle =
                  "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20";
                badgeStyle = "bg-rose-500 text-white";
              } else if (isChosen) {
                cardStyle =
                  "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20";
                badgeStyle = "bg-primary text-primary-foreground";
              }

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
                  className={`group relative flex min-h-[64px] items-center gap-3.5 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${cardStyle} ${
                    dimmed ? "opacity-40" : ""
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${badgeStyle}`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 leading-snug">
                    {isVietnamese ? option : content.optionsEn?.[index] || option}
                  </span>

                  {isCorrectAnswer && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {isWrongAnswer && (
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  {busy && isChosen && (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* DRAG DROP */}
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
                className="grid gap-2 rounded-xl border border-border/80 bg-background/50 p-3 sm:grid-cols-[1fr_1fr]"
              >
                <span className="cursor-grab self-center text-sm font-medium">
                  {displayLabel(item)}
                </span>
                <select
                  aria-label={`${displayLabel(item)} ${isVietnamese ? "vùng đích" : "target zone"}`}
                  value={assignments[item.id] ?? ""}
                  disabled={!!result || busy}
                  onChange={(event) => updateAssignment(item.id, event.target.value)}
                  className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              <div className="flex flex-wrap gap-2 pt-1" aria-label="Drop zones">
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
                    className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    {displayLabel(zone)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MATCHING */}
        {activity.type === "MATCHING" && (
          <div className="space-y-3">
            {leftItems.map((item) => (
              <label
                key={item.id}
                className="grid gap-2 text-sm sm:grid-cols-[1fr_1fr] rounded-xl border border-border/80 bg-background/50 p-3"
              >
                <span className="self-center font-medium">{displayLabel(item)}</span>
                <select
                  value={pairs[item.id] ?? ""}
                  disabled={!!result || busy}
                  onChange={(event) => updatePair(item.id, event.target.value)}
                  className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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

        {/* FILL BLANK */}
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
                <label key={blank.id} className="grid gap-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
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
                    className="h-10 rounded-xl border border-border/80 bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              );
            })}
          </div>
        )}

        {/* POLL */}
        {activity.type === "POLL" && (
          <div className="space-y-2.5">
            {labelledItems(content.options).map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-background/50 p-3.5 text-sm font-medium transition hover:bg-muted/40"
              >
                <input
                  type={content.allowMultiple ? "checkbox" : "radio"}
                  name={`poll-${activity.id}`}
                  checked={selectedPollOptions.includes(option.id)}
                  disabled={!!result || busy}
                  onChange={() => togglePollOption(option.id)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary/20"
                />
                <span>{displayLabel(option)}</span>
              </label>
            ))}
          </div>
        )}

        {/* REFLECTION */}
        {activity.type === "REFLECTION" && (
          <div className="space-y-2">
            {(isVietnamese
              ? content.dataNotice
              : content.dataNoticeEn || content.dataNotice) && (
              <p className="rounded-xl border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
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
              className="w-full rounded-xl border border-border/80 bg-background p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-right text-xs text-muted-foreground">
              {reflection.length}/{content.maxLength ?? 1000}
            </p>
          </div>
        )}

        {/* VOCABULARY */}
        {activity.type === "VOCABULARY" && (
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-4">
            {content.termEn && (
              <p className="text-sm font-medium text-primary">
                {isVietnamese ? content.termEn : content.term}
                {content.pronunciation ? ` · ${content.pronunciation}` : ""}
              </p>
            )}
            <p className="text-sm text-foreground">
              {isVietnamese
                ? content.definition || ""
                : content.definitionEn || content.definition || ""}
            </p>
            {(content.example || content.exampleEn) && (
              <p className="border-l-2 border-primary/60 pl-3 text-sm italic text-muted-foreground">
                {isVietnamese
                  ? content.example
                  : content.exampleEn || content.example}
              </p>
            )}
          </div>
        )}

        {/* AI EXPLANATION */}
        {activity.type === "AI_EXPLANATION" && (
          <div className="min-h-24 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm leading-6">
            {aiLoading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" />
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

        {/* EXPLANATION */}
        {activity.type === "EXPLANATION" && (
          <p className="whitespace-pre-wrap rounded-xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-foreground">
            {prompt}
          </p>
        )}

        {/* Result & Feedback Box */}
        {result && (
          <div
            className={`mt-5 rounded-xl border p-4 text-sm transition-all ${
              result.isCorrect === true
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                : result.isCorrect === false
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100"
                  : "border-border/70 bg-muted/40 text-foreground"
            }`}
            role="status"
          >
            <div className="flex items-center gap-2 font-semibold">
              {result.isCorrect === true ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{isVietnamese ? "Chính xác!" : "Correct!"}</span>
                </>
              ) : result.isCorrect === false ? (
                <>
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>
                    {isVietnamese
                      ? "Chưa chính xác. Bạn có thể thử lại hoặc xem lại video."
                      : "Not quite right. Try again or rewatch the video."}
                  </span>
                </>
              ) : (
                <span>
                  {isVietnamese ? "Đã ghi nhận hoạt động." : "Response recorded."}
                </span>
              )}
            </div>
            {(isVietnamese
              ? result.explanation
              : result.explanationEn || result.explanation) && (
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isVietnamese
                  ? result.explanation
                  : result.explanationEn || result.explanation}
              </p>
            )}
          </div>
        )}

        {aiError && activity.type !== "AI_EXPLANATION" && (
          <p role="alert" className="mt-3 text-xs sm:text-sm font-medium text-destructive">
            {aiError}
          </p>
        )}

        {/* Actions Bottom Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-border/60 pt-4">
          {result && answeredWrong ? (
            <>
              {canRewind && (
                <Button
                  variant="outline"
                  onClick={() => onRewind?.(activity)}
                  className="rounded-xl gap-1.5 font-medium"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isVietnamese ? "Xem lại đoạn video" : "Rewatch video"}
                </Button>
              )}
              <Button onClick={handleRetry} className="rounded-xl font-medium">
                {isVietnamese ? "Làm lại" : "Try again"}
              </Button>
            </>
          ) : result ? (
            <Button
              onClick={handleContinue}
              className="rounded-xl px-5 font-semibold"
            >
              {isVietnamese ? "Tiếp tục bài học" : "Continue video"}
            </Button>
          ) : activity.type === "QUESTION" || activity.type === "QUIZ" ? null : (
            <Button
              onClick={() => void handleSubmit()}
              disabled={busy || aiLoading}
              className="rounded-xl gap-2 font-semibold px-5"
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
