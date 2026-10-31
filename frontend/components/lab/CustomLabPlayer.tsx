"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen, CheckCircle2, Download, FileText, Volume2 } from "lucide-react";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";
import { createVirtualLabSessionStore } from "@/lib/virtual-lab/state-store";
import { StudentResultCollector } from "@/lib/virtual-lab/student-result-collector";
import { recordLabStudyHeartbeat } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type {
  BilingualText,
  CustomLabRecord,
} from "@/types/custom-lab";
import { SimulationRenderer } from "@/components/lab/virtual-lab/EngineRenderer";

type DisplayMode = "vi" | "en" | "both";

function textFor(pair: BilingualText, mode: DisplayMode) {
  if (mode === "vi") return pair.vi || pair.en;
  if (mode === "en") return pair.en || pair.vi;
  return [pair.vi, pair.en].filter(Boolean).join(" / ");
}

export function CustomLabPlayer({ lab }: { lab: CustomLabRecord }) {
  const { token, user } = useAuth();
  const [mode, setMode] = useState<DisplayMode>("both");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [completedSimulations, setCompletedSimulations] = useState<number[]>([]);
  const [speechError, setSpeechError] = useState("");
  const sessionStore = useMemo(() => createVirtualLabSessionStore(lab.id), [lab.id]);
  const resultCollector = useMemo(() => new StudentResultCollector(sessionStore), [sessionStore]);
  const simulationIndexes = lab.activities.reduce<number[]>((indexes, activity, index) => {
    if (activity.type === "simulation") indexes.push(index);
    return indexes;
  }, []);

  useEffect(() => {
    if (!token || user?.role !== "STUDENT") return;

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    let active = document.visibilityState === "visible";
    let lastTickAt = now;
    let positionMs = 0;
    let lastSentPositionMs = 0;
    let heartbeatQueue = Promise.resolve();

    const queueHeartbeat = (
      occurredAt: number,
      studiedPositionMs: number,
      keepalive = false,
    ) => {
      heartbeatQueue = heartbeatQueue
        .then(() =>
          recordLabStudyHeartbeat(
            token,
            lab.id,
            {
              clientEventId: crypto.randomUUID(),
              sessionId,
              positionMs: studiedPositionMs,
              occurredAt: new Date(occurredAt).toISOString(),
            },
            keepalive,
          ),
        )
        .catch((error: unknown) =>
          console.error("Unable to record Lab study time:", error),
        );
    };

    queueHeartbeat(now, positionMs);

    const sendHeartbeat = (occurredAt: number, keepalive = false) => {
      if (!active) return;
      const elapsedMs = Math.max(0, Math.min(occurredAt - lastTickAt, 30_000));
      lastTickAt = occurredAt;
      positionMs += elapsedMs;
      if (positionMs - lastSentPositionMs < 10_000 && !keepalive) return;
      if (positionMs === lastSentPositionMs) return;
      lastSentPositionMs = positionMs;
      queueHeartbeat(occurredAt, positionMs, keepalive);
    };

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendHeartbeat(Date.now());
      }
    }, 5_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendHeartbeat(Date.now(), true);
        active = false;
        return;
      }
      active = true;
      lastTickAt = Date.now();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sendHeartbeat(Date.now(), true);
    };
  }, [lab.id, token, user?.role]);

  const title = mode === "en" ? lab.titleEn : lab.title;
  const speak = (term: string) => {
    if (!("speechSynthesis" in window)) {
      setSpeechError(mode === "en" ? "Speech is not supported." : "Trình duyệt không hỗ trợ phát âm.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(term);
    utterance.lang = "en-US";
    utterance.onerror = () => setSpeechError(mode === "en" ? "Could not play audio." : "Không thể phát âm.");
    setSpeechError("");
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-24">
      <article className="mx-auto max-w-[906px] space-y-6">
        <Link href="/lab" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          {mode === "en" ? "Back to Labs" : "Quay lại phòng Lab"}
        </Link>
        <header className="space-y-3 rounded-3xl border border-indigo-200/70 bg-indigo-50/50 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              {lab.subject} · {mode === "en" ? "Grade" : "Lớp"} {lab.grade}
            </span>
            <div className="flex rounded-lg bg-white p-1 text-xs dark:bg-neutral-900" role="group" aria-label="Lab language">
              {(["vi", "en", "both"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                  className={`rounded-md px-2.5 py-1.5 font-semibold ${mode === value ? "bg-indigo-600 text-white" : "text-muted-foreground"}`}
                >
                  {value === "vi" ? "Tiếng Việt" : value === "en" ? "English" : "Song ngữ"}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
            {title}
          </h1>
          {mode === "both" ? <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-200">{lab.titleEn}</p> : null}
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {mode === "en" ? lab.summaryEn : lab.summary}
          </p>
          {mode === "both" ? <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-200">{lab.summaryEn}</p> : null}
          {lab.safetyNotice || lab.safetyNoticeEn ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>{mode === "en" ? "Safety notice: " : "Lưu ý an toàn: "}</strong>
              {mode === "en" ? lab.safetyNoticeEn || lab.safetyNotice : lab.safetyNotice || lab.safetyNoticeEn}
              {mode === "both" && lab.safetyNoticeEn ? <p className="mt-1">{lab.safetyNoticeEn}</p> : null}
            </div>
          ) : null}
        </header>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {mode === "en" ? "Equipment" : "Dụng cụ"}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {lab.equipment.map((item, index) => (
              <li key={index} className="rounded-lg bg-muted/40 p-3 text-sm">
                {textFor(item, mode)}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-blue-200/70 bg-card p-5 dark:border-blue-900/60">
          <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-bold">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {mode === "en" ? "Procedure" : "Các bước tiến hành"}
          </h2>
          <ol className="space-y-3.5">
            {lab.steps.map((step, index) => {
              const isComplete = completedSteps.includes(index);
              return (
                <li
                  key={index}
                  className={`flex gap-3.5 rounded-xl border p-3.5 ${step.safety ? "border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20" : "border-border"}`}
                >
                  <button
                    type="button"
                    aria-label={`${isComplete ? "Unmark" : "Mark"} step ${index + 1}`}
                    aria-pressed={isComplete}
                    onClick={() => setCompletedSteps((current) =>
                      isComplete ? current.filter((value) => value !== index) : [...current, index],
                    )}
                    className="mt-0.5 shrink-0 text-blue-600"
                  >
                    {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-bold">{index + 1}</span>}
                  </button>
                  <div className="min-w-0 flex-1 text-[15px] sm:text-base leading-relaxed">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span>{textFor(step, mode)}</span>
                      {step.en ? (
                        <button
                          type="button"
                          onClick={() => speak(step.en)}
                          aria-label={`Nghe tiếng Anh bước ${index + 1}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-muted"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          {mode === "en" ? "Listen" : "Nghe tiếng Anh"}
                        </button>
                      ) : null}
                    </div>
                    {step.safety ? (
                      <p className="mt-1 text-xs font-bold uppercase text-amber-700 dark:text-amber-300">
                        {mode === "en" ? "Safety step" : "Bước an toàn"}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {completedSteps.length}/{lab.steps.length} {mode === "en" ? "steps complete" : "bước đã hoàn thành"}
          </p>
          {speechError ? (
            <p role="alert" className="text-xs text-destructive">{speechError}</p>
          ) : null}
        </section>

        {lab.attachments.length ? (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">
              {mode === "en" ? "Lab resources" : "Tệp và học liệu đính kèm"}
            </h2>
            <div className="space-y-4">
              {lab.attachments.map((attachment, index) => (
                <article key={`${attachment.url}-${index}`} className="space-y-2 rounded-xl border border-border p-3">
                  <h3 className="break-all text-sm font-semibold">{attachment.name}</h3>
                  {attachment.type === "IMAGE" ? (
                    <Image
                      src={attachment.url}
                      alt={attachment.name}
                      width={1200}
                      height={800}
                      unoptimized
                      className="h-auto max-h-[32rem] w-full rounded-lg object-contain"
                    />
                  ) : null}
                  {attachment.type === "VIDEO" ? (
                    <div className="space-y-2">
                      <video
                        controls
                        preload="metadata"
                        src={attachment.url}
                        className="max-h-[32rem] w-full rounded-lg bg-black"
                      >
                        {mode === "en"
                          ? "Your browser does not support video playback."
                          : "Trình duyệt không hỗ trợ phát video."}
                      </video>
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {mode === "en"
                          ? "Download if playback is unsupported"
                          : "Tải video nếu trình duyệt không phát được"}
                      </a>
                    </div>
                  ) : null}
                  {attachment.type === "MODEL_3D" ? (
                    <Uploaded3DModelViewer url={attachment.url} title={attachment.name} />
                  ) : null}
                  {attachment.type === "HTML" ? (
                    <div className="space-y-2">
                      <iframe
                        src={attachment.url}
                        title={attachment.name}
                        sandbox="allow-scripts"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="aspect-video w-full rounded-lg border border-border bg-white"
                      />
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-muted"
                      >
                        {mode === "en" ? "Open Lab in a new tab" : "Mở Lab ở tab mới"}
                      </a>
                    </div>
                  ) : null}
                  {attachment.type === "PDF" || attachment.type === "DOCUMENT" ? (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                    >
                      <FileText className="h-4 w-4" />
                      {mode === "en" ? "Open or download file" : "Mở hoặc tải tệp"}
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {lab.activities.length ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{mode === "en" ? "Interactive activities" : "Hoạt động tương tác"}</h2>
              <button
                type="button"
                onClick={() => resultCollector.download()}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                {mode === "en" ? "Export practice results" : "Tải kết quả thực hành"}
              </button>
            </div>
            {lab.activities.map((activity, index) => {
              if (activity.type === "quiz" && simulationIndexes.length > 0
                && simulationIndexes.some((simulationIndex) => !completedSimulations.includes(simulationIndex))) {
                return (
                  <p key={index} className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    {mode === "en"
                      ? "Record at least one measurement in each simulation to unlock the review questions."
                      : "Hãy ghi ít nhất một số liệu ở mỗi mô phỏng để mở câu hỏi củng cố."}
                  </p>
                );
              }
              return (
                <SimulationRenderer
                  key={index}
                  activity={activity}
                  activityId={`${index}`}
                  mode={mode}
                  index={index}
                  store={sessionStore}
                  onRecord={() => setCompletedSimulations((current) =>
                    current.includes(index) ? current : [...current, index],
                  )}
                />
              );
            })}
          </section>
        ) : null}

        {lab.vocabulary.length ? (
          <section className="space-y-3 rounded-2xl border border-emerald-200/70 bg-card p-5 dark:border-emerald-900/60">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {mode === "en" ? "Scientific vocabulary" : "Thuật ngữ chuyên ngành"}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {lab.vocabulary.map((term, index) => (
                <div key={index} className="space-y-1 rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-950/20">
                  <p className="text-sm font-bold">{textFor(term, mode)}</p>
                  {term.ipa ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-muted-foreground">IPA: {term.ipa}</span>
                      <button type="button" onClick={() => speak(term.en)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <Volume2 className="h-3.5 w-3.5" /> {mode === "en" ? "Listen" : "Nghe"}
                      </button>
                    </div>
                  ) : null}
                  {term.definitionVi || term.definitionEn ? (
                    <p className="text-xs text-muted-foreground">
                      {mode === "en" ? term.definitionEn || term.definitionVi : term.definitionVi || term.definitionEn}
                      {mode === "both" && term.definitionEn ? ` / ${term.definitionEn}` : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            {speechError ? <p role="alert" className="text-xs text-destructive">{speechError}</p> : null}
          </section>
        ) : null}
      </article>
    </main>
  );
}
