"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen, CheckCircle2, Download, FileText, FlaskConical, Volume2 } from "lucide-react";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";
import { createVirtualLabSessionStore } from "@/lib/virtual-lab/state-store";
import { StudentResultCollector } from "@/lib/virtual-lab/student-result-collector";
import { recordLabStudyHeartbeat } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CustomLabRecord,
} from "@/types/custom-lab";
import { SimulationRenderer } from "@/components/lab/virtual-lab/EngineRenderer";

type DisplayMode = "vi" | "en" | "both";
type TrackedReading = {
  id: string;
  label: string;
  value: number;
  unit: string;
  kind: "parameter" | "output";
};
type TrackedMeasurement = {
  recordedAt: string;
  readings: TrackedReading[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTrackedReadings(value: unknown, kind: TrackedReading["kind"]): TrackedReading[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): TrackedReading[] => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.label !== "string" ||
      typeof item.value !== "number" ||
      !Number.isFinite(item.value) ||
      typeof item.unit !== "string"
    ) {
      return [];
    }
    return [{
      id: `${kind}:${item.id}`,
      label: item.label.slice(0, 120),
      value: item.value,
      unit: item.unit.slice(0, 30),
      kind,
    }];
  });
}

export function CustomLabPlayer({ lab }: { lab: CustomLabRecord }) {
  const { token, user } = useAuth();
  const [mode, setMode] = useState<DisplayMode>("both");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [completedSimulations, setCompletedSimulations] = useState<number[]>([]);
  const [speechError, setSpeechError] = useState("");
  const [simulationReadings, setSimulationReadings] = useState<TrackedReading[]>([]);
  const [measurements, setMeasurements] = useState<TrackedMeasurement[]>([]);
  const simulationFrameRef = useRef<HTMLIFrameElement>(null);
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
  const subjectLabel = {
    science: mode === "en" ? "Natural science" : "Khoa học tự nhiên",
    physics: mode === "en" ? "Physics" : "Vật lý",
    chemistry: mode === "en" ? "Chemistry" : "Hóa học",
    biology: mode === "en" ? "Biology" : "Sinh học",
  }[lab.subject];
  const htmlAttachment = lab.attachments.find(({ type }) => type === "HTML");
  const simulation = lab.attachments.find(({ type }) => type === "SIMULATION");
  const resourceAttachments = lab.attachments.filter(({ type }) => type !== "SIMULATION");

  useEffect(() => {
    const handleSimulationMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== simulationFrameRef.current?.contentWindow || !isRecord(event.data)) {
        return;
      }
      if (event.data.source !== "smart-explorer-lab" || event.data.type !== "telemetry") {
        return;
      }

      const parameters = parseTrackedReadings(event.data.parameters, "parameter");
      const outputs = parseTrackedReadings(event.data.outputs, "output");
      const readings = [...parameters, ...outputs];
      setSimulationReadings(readings);
      for (const parameter of parameters) {
        const previousValue =
          sessionStore.getState().parameterValues["uploaded-tsx"]?.[parameter.id];
        if (previousValue !== parameter.value) {
          sessionStore.getState().setParameter(
            "uploaded-tsx",
            parameter.id,
            parameter.value,
          );
        }
      }
    };

    window.addEventListener("message", handleSimulationMessage);
    return () => window.removeEventListener("message", handleSimulationMessage);
  }, [sessionStore]);

  const recordSimulationMeasurement = () => {
    if (!simulationReadings.length) return;
    const measurement = {
      recordedAt: new Date().toISOString(),
      readings: simulationReadings,
    };
    setMeasurements((current) => [...current, measurement]);
    sessionStore.getState().recordMeasurement(
      "uploaded-tsx",
      Object.fromEntries(
        simulationReadings.map((reading) => [
          `${reading.kind === "parameter" ? "Parameter" : "Result"}: ${reading.label}${reading.unit ? ` (${reading.unit})` : ""}`,
          reading.value,
        ]),
      ),
    );
  };

  const measurementColumns = useMemo(() => {
    const readings = [...simulationReadings, ...measurements.flatMap(({ readings: row }) => row)];
    return Array.from(
      new Map(readings.map((reading) => [reading.id, reading])).values(),
    );
  }, [measurements, simulationReadings]);
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
    <main className="min-h-screen bg-neutral-50/50 px-4 pb-20 pt-24 transition-colors dark:bg-[#0c1222] sm:pt-28">
      <article className="mx-auto max-w-7xl space-y-6">
        <div className="sticky top-20 z-40 -mx-1 flex justify-start py-2">
          <Link
            href="/lab?tab=custom"
            className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50/95 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-md backdrop-blur transition-all hover:-translate-x-0.5 hover:bg-purple-100 dark:border-purple-800/80 dark:bg-purple-950/95 dark:text-purple-300 dark:hover:bg-purple-900/95"
          >
            <ArrowLeft className="h-4 w-4" />
            {mode === "en" ? "Back to Lab list" : "Quay lại danh mục Lab"}
          </Link>
        </div>
        <section className="rounded-3xl border border-neutral-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95 sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <Link href="/lab" className="font-medium hover:text-purple-600 dark:hover:text-purple-400">
                  {mode === "en" ? "Lab room" : "Phòng Lab"}
                </Link>
                <span>/</span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {mode === "en" ? "Grade" : "Lớp"} {lab.grade} · {subjectLabel}
                </span>
                <span>/</span>
                <span className="max-w-[200px] truncate font-bold text-purple-600 dark:text-purple-400 sm:max-w-[320px]">
                  {title}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300 sm:self-auto">
              <FlaskConical className="h-3.5 w-3.5" />
              {mode === "en" ? "Teacher-created Lab" : "Lab do giáo viên tạo"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              Ngôn ngữ Lab / Lab language
            </span>
            <div
              className="inline-flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800"
              role="group"
              aria-label="Chọn ngôn ngữ nội dung Lab"
            >
              {([
                ["vi", "Tiếng Việt"],
                ["en", "English"],
                ["both", "Song ngữ / Both"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    mode === value
                      ? "bg-white text-purple-700 shadow-xs dark:bg-neutral-700 dark:text-purple-300"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-sky-200/70 bg-sky-50/70 p-5 shadow-xs dark:border-sky-900/60 dark:bg-sky-950/20">
          <h1 className="text-base font-bold text-neutral-900 dark:text-white sm:text-lg">
            {title}
          </h1>
          {mode === "both" && lab.titleEn !== lab.title ? (
            <p className="mt-1 text-sm font-semibold text-sky-800 dark:text-sky-200">
              {lab.titleEn}
            </p>
          ) : null}
          {(lab.summary || lab.summaryEn) ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {mode === "en" ? lab.summaryEn || lab.summary : lab.summary || lab.summaryEn}
              </p>
              {mode === "both" && lab.summaryEn && lab.summaryEn !== lab.summary ? (
                <p className="mt-1 text-sm leading-relaxed text-sky-800 dark:text-sky-200">
                  {lab.summaryEn}
                </p>
              ) : null}
            </>
          ) : null}
          {lab.safetyNotice || lab.safetyNoticeEn ? (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>{mode === "en" ? "Safety notice: " : "Lưu ý an toàn: "}</strong>
              {mode === "en" ? lab.safetyNoticeEn || lab.safetyNotice : lab.safetyNotice || lab.safetyNoticeEn}
              {mode === "both" && lab.safetyNoticeEn ? <p className="mt-1">{lab.safetyNoticeEn}</p> : null}
            </div>
          ) : null}
        </section>

        {simulation ? (
          <section className="space-y-4 rounded-3xl border border-indigo-200/70 bg-white/95 p-4 shadow-xs dark:border-indigo-900/60 dark:bg-neutral-900/95 sm:p-5">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                <FlaskConical className="h-4 w-4 text-indigo-500" />
                {mode === "en" ? "Interactive Lab simulation" : "Mô phỏng tương tác của bài Lab"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {simulation.name}
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <iframe
                ref={simulationFrameRef}
                src={simulation.url}
                title={simulation.name}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                loading="lazy"
                style={{ height: "clamp(600px, 82vh, 1050px)" }}
                className="w-full border-0 bg-slate-950"
              />
            </div>
          </section>
        ) : null}

        {simulation ? (
          <section className="space-y-4 rounded-3xl border border-cyan-200/70 bg-white/95 p-5 shadow-xs dark:border-cyan-900/60 dark:bg-neutral-900/95">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  {mode === "en" ? "Track and compare measurements" : "Theo dõi và so sánh thông số"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {mode === "en"
                    ? "Adjust the simulation controls, then record each run to compare its input parameters and changing SVG readings."
                    : "Thay đổi thanh trượt trong mô phỏng rồi ghi từng lần đo để so sánh thông số đầu vào và các chỉ số SVG thay đổi."}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={recordSimulationMeasurement}
                  disabled={!simulationReadings.length}
                  className="rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mode === "en" ? "Record measurement" : "Ghi lần đo"}
                </button>
                <button
                  type="button"
                  onClick={() => resultCollector.download()}
                  disabled={!measurements.length}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {mode === "en" ? "Export" : "Xuất"}
                </button>
              </div>
            </div>
            {!simulationReadings.length ? (
              <p role="status" className="rounded-xl border border-dashed border-cyan-200 p-3 text-xs text-neutral-500 dark:border-cyan-900">
                {mode === "en"
                  ? "Waiting for simulation controls and readings..."
                  : "Đang chờ thông số điều khiển và số liệu từ mô phỏng..."}
              </p>
            ) : null}
            {measurements.length ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">#</th>
                      <th className="px-3 py-2.5 font-bold">
                        {mode === "en" ? "Recorded at" : "Thời điểm"}
                      </th>
                      {measurementColumns.map((column) => (
                        <th key={column.id} className="px-3 py-2.5 font-bold">
                          <span>{column.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((measurement, index) => {
                      const readingsById = new Map(
                        measurement.readings.map((reading) => [reading.id, reading]),
                      );
                      return (
                        <tr key={`${measurement.recordedAt}-${index}`} className="border-t border-border">
                          <td className="px-3 py-2.5 font-semibold">{index + 1}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                            {new Date(measurement.recordedAt).toLocaleTimeString(
                              mode === "en" ? "en-US" : "vi-VN",
                              { hour: "2-digit", minute: "2-digit", second: "2-digit" },
                            )}
                          </td>
                          {measurementColumns.map((column) => {
                            const reading = readingsById.get(column.id);
                            return (
                              <td key={column.id} className="px-3 py-2.5 font-mono">
                                {reading ? `${reading.value}${reading.unit ? ` ${reading.unit}` : ""}` : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {mode === "en"
                  ? "No measurements recorded yet. Change a control and record the first run."
                  : "Chưa có lần đo nào. Hãy thay đổi thông số và ghi lần đo đầu tiên."}
              </p>
            )}
          </section>
        ) : null}

        {lab.equipment.length ? <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {mode === "en" ? "Equipment" : "Dụng cụ"}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {lab.equipment.map((item, index) => (
              <li key={index} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                <div className="min-w-0 flex-1 space-y-0.5">
                  {mode !== "en" && item.vi ? <p>{item.vi}</p> : null}
                  {mode !== "vi" && item.en ? (
                    <p className={mode === "both" ? "text-sky-800 dark:text-sky-200" : ""}>
                      {item.en}
                    </p>
                  ) : null}
                </div>
                {item.en.trim() ? (
                  <button
                    type="button"
                    onClick={() => speak(item.en)}
                    aria-label={`${mode === "en" ? "Listen to" : "Nghe phát âm"} ${item.en}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    {mode === "en" ? "Listen" : "Nghe"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section> : null}
        {speechError ? <p role="alert" className="text-xs text-destructive">{speechError}</p> : null}

        {lab.steps.length ? <section className="space-y-4 rounded-2xl border border-blue-200/70 bg-card p-5 dark:border-blue-900/60">
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        {mode !== "en" && step.vi ? <p>{step.vi}</p> : null}
                        {mode !== "vi" && step.en ? (
                          <p className={mode === "both" ? "text-sky-800 dark:text-sky-200" : ""}>
                            {step.en}
                          </p>
                        ) : null}
                      </div>
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
        </section> : null}

        {resourceAttachments.length ? (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                {mode === "en" ? "Lab resources" : "Tệp và học liệu đính kèm"}
              </h2>
              {htmlAttachment ? (
                <a
                  href={htmlAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-muted"
                >
                  {mode === "en" ? "Open Lab in a new tab" : "Mở Lab ở tab mới"}
                </a>
              ) : null}
            </div>
            <div className="space-y-4">
              {resourceAttachments.map((attachment, index) => (
                <article
                  key={`${attachment.url}-${index}`}
                  className={`space-y-2 rounded-xl border border-border ${
                    attachment.type === "HTML"
                      ? "relative left-1/2 -translate-x-1/2 p-4"
                      : "p-3"
                  }`}
                  style={attachment.type === "HTML"
                    ? { width: "min(1200px, calc(100vw - 2rem))" }
                    : undefined}
                >
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
                    <iframe
                      src={attachment.url}
                      title={attachment.name}
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      style={{ height: "clamp(400px, 80vh, 1000px)" }}
                      className="w-full rounded-lg border border-border bg-white"
                    />
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
                  <div className="space-y-0.5">
                    {mode !== "en" && term.vi ? (
                      <p className="text-sm font-bold">{term.vi}</p>
                    ) : null}
                    {mode !== "vi" && term.en ? (
                      <p className={`text-sm font-bold ${mode === "both" ? "text-sky-800 dark:text-sky-200" : ""}`}>
                        {term.en}
                      </p>
                    ) : null}
                  </div>
                  {term.ipa || term.en.trim() ? (
                    <div className="flex items-center justify-between gap-2">
                      {term.ipa ? (
                        <span className="text-xs font-mono text-muted-foreground">IPA: {term.ipa}</span>
                      ) : <span />}
                      {term.en.trim() ? (
                        <button type="button" onClick={() => speak(term.en)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <Volume2 className="h-3.5 w-3.5" /> {mode === "en" ? "Listen" : "Nghe"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {term.definitionVi || term.definitionEn ? (
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {mode !== "en" && term.definitionVi ? <p>{term.definitionVi}</p> : null}
                      {mode !== "vi" && term.definitionEn ? <p>{term.definitionEn}</p> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
