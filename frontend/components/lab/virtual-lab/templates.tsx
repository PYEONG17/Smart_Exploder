"use client";

import { createElement, useState } from "react";
import Image from "next/image";
import type { ComponentType } from "react";
import type { CustomLabActivity, VirtualLabOption } from "@/types/custom-lab";
import { useStore } from "zustand";
import type { VirtualLabSessionStore } from "@/lib/virtual-lab/state-store";

type TemplateProps = {
  activity: Extract<CustomLabActivity, { type: "template" }>;
  activityId: string;
  mode: "vi" | "en" | "both";
  store: VirtualLabSessionStore;
};

type TemplateId = Extract<CustomLabActivity, { type: "template" }>["template"];

function text(value: { vi: string; en: string }, mode: TemplateProps["mode"]) {
  return mode === "both"
    ? [value.vi, value.en].filter(Boolean).join(" / ")
    : mode === "en" ? value.en || value.vi : value.vi || value.en;
}

function MatchingTemplate({ activity, activityId, mode, store }: TemplateProps) {
  const matches = useStore(store, (state) => state.matches[activityId] ?? {});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  if (activity.template !== "matching" && activity.template !== "drag-drop") return null;

  const assign = (targetId: string) => {
    if (!selectedId) return;
    const updated = { ...matches, [selectedId]: targetId };
    const score = Math.round(
      Object.entries(updated).filter(([itemId, assignedTarget]) =>
        activity.correctMatches[itemId] === assignedTarget,
      ).length / activity.items.length * 100,
    );
    store.getState().submitMatches(activityId, updated, score);
    setSelectedId(null);
    setMessage("");
  };
  const check = () => {
    const score = Math.round(
      activity.items.filter((item) => matches[item.id] === activity.correctMatches[item.id]).length
      / activity.items.length * 100,
    );
    store.getState().submitMatches(activityId, matches, score);
    setMessage(mode === "en" ? `Score: ${score}%` : `Kết quả: ${score}%`);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/20">
      <header>
        <h3 className="font-bold">{mode === "en" ? activity.titleEn || activity.titleVi : activity.titleVi || activity.titleEn}</h3>
        <p className="text-sm text-muted-foreground">{text(activity.instructions, mode)}</p>
        <p className="text-xs text-muted-foreground">
          {mode === "en" ? "Select an item, then select its match. Drag and drop is also supported." : "Chọn một mục rồi chọn nội dung ghép tương ứng; có thể kéo thả."}
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase">{mode === "en" ? "Items" : "Mục cần ghép"}</h4>
          {activity.items.map((item) => (
            <button
              key={item.id}
              type="button"
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
              onClick={() => setSelectedId(item.id)}
              aria-pressed={selectedId === item.id}
              className={`w-full rounded-xl border p-3 text-left text-sm ${selectedId === item.id ? "border-sky-600 bg-sky-100 dark:bg-sky-950" : "border-border bg-background"}`}
            >
              {text(item, mode)}
              {matches[item.id] ? <span className="ml-2 text-xs text-muted-foreground">✓</span> : null}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase">{mode === "en" ? "Matches" : "Đáp án ghép"}</h4>
          {activity.targets.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => assign(target.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const itemId = event.dataTransfer.getData("text/plain");
                if (!activity.items.some((item) => item.id === itemId)) return;
                const updated = { ...matches, [itemId]: target.id };
                const score = Math.round(
                  Object.entries(updated).filter(([id, value]) => activity.correctMatches[id] === value).length
                  / activity.items.length * 100,
                );
                store.getState().submitMatches(activityId, updated, score);
              }}
              className={`w-full rounded-xl border border-dashed p-3 text-left text-sm ${selectedId ? "border-sky-400 bg-background" : "border-border bg-background"}`}
            >
              <span>{text(target, mode)}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {activity.items.filter((item) => matches[item.id] === target.id).map((item) => text(item, mode)).join(", ")}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={check} className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-bold text-white">
          {mode === "en" ? "Check answers" : "Kiểm tra"}
        </button>
        {message ? <span aria-live="polite" className="text-sm font-bold">{message}</span> : null}
      </div>
    </section>
  );
}

function LabelingTemplate({ activity, activityId, mode, store }: TemplateProps) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  if (activity.template !== "labeling") return null;
  const correctCount = Object.entries(labels).filter(([id, value]) => id === value).length;
  const check = () => {
    const score = Math.round(correctCount / activity.labels.length * 100);
    store.getState().submitMatches(activityId, labels, score);
    setMessage(mode === "en" ? `Score: ${score}%` : `Kết quả: ${score}%`);
  };
  const availableLabels: VirtualLabOption[] = activity.labels.map(({ id, vi, en }) => ({ id, vi, en }));
  return (
    <section className="space-y-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      <header>
        <h3 className="font-bold">{mode === "en" ? activity.titleEn || activity.titleVi : activity.titleVi || activity.titleEn}</h3>
        <p className="text-sm text-muted-foreground">{text(activity.instructions, mode)}</p>
      </header>
      <div className="relative overflow-hidden rounded-xl border border-border bg-background">
        <Image src={activity.imageUrl} alt={activity.titleVi} width={1200} height={800} unoptimized className="h-auto max-h-[34rem] w-full object-contain" />
        {activity.labels.map((point) => (
          <div key={point.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-violet-700 text-xs font-bold text-white shadow">{activity.labels.indexOf(point) + 1}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {activity.labels.map((point, index) => (
          <label key={point.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-xs">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 font-bold dark:bg-violet-950">{index + 1}</span>
            <select
              value={labels[point.id] ?? ""}
              onChange={(event) => setLabels((current) => ({ ...current, [point.id]: event.target.value }))}
              className="min-w-0 flex-1 bg-transparent"
              aria-label={`${mode === "en" ? "Label" : "Nhãn"} ${index + 1}`}
            >
              <option value="">{mode === "en" ? "Choose a label" : "Chọn nhãn"}</option>
              {availableLabels.map((option) => (
                <option key={option.id} value={option.id}>{text(option, mode)}</option>
              ))}
            </select>
            <button type="button" onClick={() => setRevealed((current) => current.includes(point.id) ? current : [...current, point.id])} className="text-violet-700">
              {mode === "en" ? "Hint" : "Gợi ý"}
            </button>
            {revealed.includes(point.id) ? <span className="font-semibold">{text(point, mode)}</span> : null}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={check} className="rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white">
          {mode === "en" ? "Check labels" : "Kiểm tra nhãn"}
        </button>
        {message ? <span aria-live="polite" className="text-sm font-bold">{message}</span> : null}
      </div>
    </section>
  );
}

function TimelineTemplate({ activity, mode }: TemplateProps) {
  if (activity.template !== "timeline") return null;
  return (
    <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20">
      <h3 className="font-bold">{mode === "en" ? activity.titleEn || activity.titleVi : activity.titleVi || activity.titleEn}</h3>
      <ol className="space-y-3 border-l-2 border-amber-300 pl-4">
        {[...activity.events].sort((a, b) => a.date.localeCompare(b.date)).map((event) => (
          <li key={event.id} className="relative rounded-xl bg-background p-3">
            <span className="absolute -left-[1.42rem] top-4 h-3 w-3 rounded-full bg-amber-500" />
            <p className="text-xs font-bold text-amber-700">{event.date}</p>
            <h4 className="font-semibold">{text(event.title, mode)}</h4>
            <p className="text-sm text-muted-foreground">{text(event.description, mode)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ImageQuizTemplate({ activity, activityId, mode, store }: TemplateProps) {
  const answer = useStore(store, (state) => state.quizAnswers[activityId]);
  if (activity.template !== "image-quiz") return null;
  return (
    <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
      <h3 className="font-bold">{mode === "en" ? activity.titleEn || activity.titleVi : activity.titleVi || activity.titleEn}</h3>
      <Image src={activity.imageUrl} alt={activity.titleVi} width={1200} height={800} unoptimized className="max-h-[28rem] w-full rounded-xl bg-background object-contain" />
      <p className="text-sm font-semibold">{text(activity.question, mode)}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {activity.options.map((option, index) => {
          const correct = index === activity.correctIndex;
          const chosen = answer === index;
          return (
            <button key={option.id} type="button" onClick={() => store.getState().answerQuiz(activityId, index, correct)}
              className={`rounded-xl border p-3 text-left text-sm ${answer !== undefined && correct ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-950" : chosen ? "border-rose-500 bg-rose-50 dark:bg-rose-950" : "border-border bg-background"}`}>
              {text(option, mode)}
            </button>
          );
        })}
      </div>
      {answer !== undefined ? <p aria-live="polite" className="rounded-lg bg-background p-3 text-sm">{text(activity.explanation, mode)}</p> : null}
    </section>
  );
}

function DiagramTemplate({ activity }: TemplateProps) {
  if (activity.template !== "diagram") return null;
  return (
    <section className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
      <h3 className="font-bold">{activity.titleVi}</h3>
      <div className="relative overflow-hidden rounded-xl border border-border bg-background">
        <Image src={activity.imageUrl} alt={activity.titleVi} width={1200} height={800} unoptimized className="h-auto max-h-[36rem] w-full object-contain" />
        {activity.labels.map((label, index) => (
          <div key={label.id} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${label.x}%`, top: `${label.y}%` }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white shadow">{index + 1}</span>
            <span className="absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block group-focus-within:block">{label.vi} / {label.en}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export class TemplateRegistry {
  private readonly templates = new Map<TemplateId, ComponentType<TemplateProps>>();

  register(template: TemplateId, component: ComponentType<TemplateProps>) {
    if (this.templates.has(template)) throw new Error(`Virtual Lab template already registered: ${template}`);
    this.templates.set(template, component);
  }

  resolve(template: TemplateId) {
    return this.templates.get(template);
  }
}

export const virtualLabTemplateRegistry = new TemplateRegistry();
virtualLabTemplateRegistry.register("drag-drop", MatchingTemplate);
virtualLabTemplateRegistry.register("matching", MatchingTemplate);
virtualLabTemplateRegistry.register("labeling", LabelingTemplate);
virtualLabTemplateRegistry.register("timeline", TimelineTemplate);
virtualLabTemplateRegistry.register("image-quiz", ImageQuizTemplate);
virtualLabTemplateRegistry.register("diagram", DiagramTemplate);

export function VirtualLabTemplateRenderer(props: TemplateProps) {
  const Component = virtualLabTemplateRegistry.resolve(props.activity.template);
  if (!Component) {
    return <p role="alert" className="text-sm text-destructive">Template is not registered: {props.activity.template}</p>;
  }
  return createElement(Component, props);
}
