"use client";

import { useState } from "react";
import type { EngineRendererProps } from "@/lib/virtual-lab/engine/types";

type DisplayMode = EngineRendererProps["mode"];
function textFor(pair: { vi: string; en: string }, mode: DisplayMode) {
  if (mode === "vi") return pair.vi || pair.en;
  if (mode === "en") return pair.en || pair.vi;
  return [pair.vi, pair.en].filter(Boolean).join(" / ");
}

export default function InteractionEngine(props: EngineRendererProps) {
  if (
    props.activity.type !== "observe" &&
    props.activity.type !== "slider" &&
    props.activity.type !== "switch" &&
    props.activity.type !== "quiz"
  ) return null;
  return (
    <InteractionActivity
      activity={props.activity}
      activityId={props.activityId}
      mode={props.mode}
      index={props.index}
      store={props.store}
    />
  );
}

function InteractionActivity({
  activity,
  activityId,
  mode,
  index,
  store,
}: {
  activity: Extract<EngineRendererProps["activity"], { type: "observe" | "slider" | "switch" | "quiz" }>;
  activityId: string;
  mode: EngineRendererProps["mode"];
  index: number;
  store: EngineRendererProps["store"];
}) {
  const [sliderValue, setSliderValue] = useState(
    activity.type === "slider" ? activity.initialValue : 0,
  );
  const [isOn, setIsOn] = useState(
    activity.type === "switch" ? activity.initialOn : false,
  );
  const [answer, setAnswer] = useState<number | null>(null);

  const title =
    mode === "en"
      ? activity.titleEn || activity.titleVi
      : activity.titleVi || activity.titleEn;
  const description =
    mode === "en"
      ? activity.descriptionEn || activity.descriptionVi
      : activity.descriptionVi || activity.descriptionEn;

  return (
    <section className="space-y-3 rounded-2xl border border-cyan-200/70 bg-cyan-50/40 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20">
      <div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          {title || `${mode === "en" ? "Activity" : "Hoạt động"} ${index + 1}`}
        </h3>
        {description ? (
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
            {description}
          </p>
        ) : null}
      </div>

      {activity.type === "observe" ? (
        <p className="rounded-xl bg-white p-3 text-sm dark:bg-neutral-900">
          {textFor(activity.prompt, mode)}
        </p>
      ) : null}

      {activity.type === "slider" ? (
        <div className="space-y-3 rounded-xl bg-white p-3 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{sliderValue} {mode === "en" ? activity.unitEn || activity.unitVi : activity.unitVi || activity.unitEn}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {activity.min} — {activity.max}
            </span>
          </div>
          <input
            aria-label={title || "Lab parameter"}
            type="range"
            min={activity.min}
            max={activity.max}
            step={activity.step}
            value={sliderValue}
            onChange={(event) => {
              const value = Number(event.target.value);
              setSliderValue(value);
              store.getState().setParameter(activityId, "value", value);
            }}
            className="w-full accent-cyan-600"
          />
          <p className="rounded-lg bg-cyan-50 p-3 text-xs leading-relaxed dark:bg-cyan-950/40">
            {textFor(
              sliderValue < (activity.min + activity.max) / 2
                ? activity.lowResult
                : activity.highResult,
              mode,
            )}
          </p>
        </div>
      ) : null}

      {activity.type === "switch" ? (
        <div className="space-y-3 rounded-xl bg-white p-3 dark:bg-neutral-900">
          <button
            type="button"
            role="switch"
            aria-checked={isOn}
            onClick={() => {
              const nextValue = !isOn;
              setIsOn(nextValue);
              store.getState().setParameter(activityId, "switch", Number(nextValue));
            }}
            className={`rounded-full px-4 py-2 text-xs font-bold text-white ${
              isOn ? "bg-emerald-600" : "bg-neutral-500"
            }`}
          >
            {textFor(isOn ? activity.onLabel : activity.offLabel, mode)}
          </button>
          <p className="rounded-lg bg-cyan-50 p-3 text-xs leading-relaxed dark:bg-cyan-950/40">
            {textFor(isOn ? activity.onResult : activity.offResult, mode)}
          </p>
        </div>
      ) : null}

      {activity.type === "quiz" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{textFor(activity.question, mode)}</p>
          {activity.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === activity.correctIndex;
            const selected = answer === optionIndex;
            return (
              <button
                key={optionIndex}
                type="button"
                onClick={() => {
                  setAnswer(optionIndex);
                  store.getState().answerQuiz(activityId, optionIndex, isCorrect);
                }}
                className={`block w-full rounded-xl border p-3 text-left text-xs ${
                  answer !== null && isCorrect
                    ? "border-emerald-500 bg-emerald-500/10"
                    : selected
                      ? "border-rose-500 bg-rose-500/10"
                      : "border-border bg-white dark:bg-neutral-900"
                }`}
              >
                {String.fromCharCode(65 + optionIndex)}. {textFor(option, mode)}
              </button>
            );
          })}
          {answer !== null ? (
            <p className="rounded-xl bg-white p-3 text-xs leading-relaxed dark:bg-neutral-900">
              <strong>
                {answer === activity.correctIndex
                  ? mode === "en" ? "Correct!" : "Chính xác!"
                  : mode === "en" ? "Not quite." : "Chưa đúng."}
              </strong>{" "}
              {textFor(activity.explanation, mode)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
