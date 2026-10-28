"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen, CheckCircle2, Download, FileText, Trash2, Volume2 } from "lucide-react";
import { Uploaded3DModelViewer } from "@/components/ui/Uploaded3DModelViewer";
import { evaluateLabFormula } from "@/lib/lab-formula";
import type {
  BilingualText,
  CustomLabActivity,
  CustomLabRecord,
} from "@/types/custom-lab";

type DisplayMode = "vi" | "en" | "both";

function textFor(pair: BilingualText, mode: DisplayMode) {
  if (mode === "vi") return pair.vi || pair.en;
  if (mode === "en") return pair.en || pair.vi;
  return [pair.vi, pair.en].filter(Boolean).join(" / ");
}

function ActivityCard({
  activity,
  mode,
  index,
}: {
  activity: CustomLabActivity;
  mode: DisplayMode;
  index: number;
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
            onChange={(event) => setSliderValue(Number(event.target.value))}
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
            onClick={() => setIsOn((value) => !value)}
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
                onClick={() => setAnswer(optionIndex)}
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

type MeasurementRow = {
  recordedAt: string;
  values: Record<string, number>;
};

function SimulationCard({
  activity,
  mode,
  onRecord,
}: {
  activity: Extract<CustomLabActivity, { type: "simulation" }>;
  mode: DisplayMode;
  onRecord: () => void;
}) {
  const [values, setValues] = useState<Record<string, number>>(
    () => Object.fromEntries(activity.parameters.map((parameter) => [parameter.id, parameter.initialValue])),
  );
  const [rows, setRows] = useState<MeasurementRow[]>([]);

  const outputs = useMemo(() => activity.outputs.map((output) => {
    try {
      return { ...output, value: evaluateLabFormula(output.formula, values), error: "" };
    } catch (formulaError) {
      return {
        ...output,
        value: null,
        error: formulaError instanceof Error ? formulaError.message : "Invalid formula",
      };
    }
  }), [activity.outputs, values]);
  const isEnglish = mode === "en";
  const label = (vi: string, en: string) => mode === "both"
    ? [vi, en].filter(Boolean).join(" / ")
    : isEnglish ? en : vi;

  const recordMeasurement = () => {
    if (outputs.some((output) => output.error)) return;
    const outputValues: Record<string, number> = {};
    for (const output of outputs) {
      if (output.value === null) return;
      outputValues[output.id] = output.value;
    }
    setRows((current) => [...current, {
      recordedAt: new Date().toISOString(),
      values: {
        ...values,
        ...outputValues,
      },
    }]);
    onRecord();
  };

  const downloadCsv = () => {
    const columns = [
      ...activity.parameters.map((parameter) => ({
        id: parameter.id,
        label: isEnglish ? parameter.labelEn : parameter.labelVi,
        unit: isEnglish ? parameter.unitEn : parameter.unitVi,
      })),
      ...activity.outputs.map((output) => ({
        id: output.id,
        label: isEnglish ? output.labelEn : output.labelVi,
        unit: isEnglish ? output.unitEn : output.unitVi,
      })),
    ];
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      [label("Thời gian ghi", "Recorded at"), ...columns.map(({ label: name, unit }) => `${name} (${unit})`)].map(escapeCsv).join(","),
      ...rows.map((row) => [
        new Date(row.recordedAt).toLocaleString(),
        ...columns.map(({ id }) => row.values[id]),
      ].map(escapeCsv).join(",")),
    ].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "lab-measurements.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-200/70 bg-cyan-50/40 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20">
      <header>
        <h3 className="font-bold">{label(activity.titleVi, activity.titleEn) || label("Mô phỏng tương tác", "Interactive simulation")}</h3>
        {activity.descriptionVi || activity.descriptionEn ? (
          <p className="mt-1 text-xs text-muted-foreground">{textFor({ vi: activity.descriptionVi, en: activity.descriptionEn }, mode)}</p>
        ) : null}
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-background p-4">
          <h4 className="text-sm font-bold">{label("Biến điều khiển", "Controls")}</h4>
          {activity.parameters.map((parameter) => (
            <label key={parameter.id} className="block space-y-2 text-xs">
              <span className="flex items-center justify-between gap-2 font-semibold">
                <span>{label(parameter.labelVi, parameter.labelEn)}</span>
                <span>{values[parameter.id]} {isEnglish ? parameter.unitEn : parameter.unitVi}</span>
              </span>
              <input
                type="range"
                min={parameter.min}
                max={parameter.max}
                step={parameter.step}
                value={values[parameter.id]}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  [parameter.id]: Number(event.target.value),
                }))}
                className="w-full accent-cyan-600"
                aria-label={label(parameter.labelVi, parameter.labelEn)}
              />
              <span className="flex justify-between text-[10px] text-muted-foreground">
                <span>{parameter.min}</span><span>{parameter.max}</span>
              </span>
            </label>
          ))}
          <button
            type="button"
            onClick={recordMeasurement}
            disabled={outputs.some((output) => output.error)}
            className="w-full rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-800"
          >
            {label("Ghi số liệu", "Record measurement")}
          </button>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-background p-4">
          <h4 className="text-sm font-bold">{label("Kết quả tính toán", "Calculated results")}</h4>
          {outputs.map((output) => (
            <div key={output.id} className="rounded-lg bg-cyan-50 p-3 dark:bg-cyan-950/30">
              <p className="text-xs text-muted-foreground">{label(output.labelVi, output.labelEn)}</p>
              {output.error ? (
                <p role="alert" className="mt-1 text-xs text-destructive">{output.error}</p>
              ) : (
                <p className="mt-1 text-xl font-black">
                  {output.value?.toLocaleString(undefined, { maximumSignificantDigits: 6 })} {isEnglish ? output.unitEn : output.unitVi}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">{output.id} = {output.formula}</p>
            </div>
          ))}
        </div>
      </div>
      {rows.length ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold">{label("Bảng số liệu", "Measurement table")} ({rows.length})</h4>
            <div className="flex gap-2">
              <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button type="button" onClick={() => setRows([])} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> {label("Xóa bảng", "Clear")}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border bg-background">
            <table className="w-full min-w-max text-left text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2">#</th>
                  {activity.parameters.map((parameter) => <th key={parameter.id} className="p-2">{label(parameter.labelVi, parameter.labelEn)} ({isEnglish ? parameter.unitEn : parameter.unitVi})</th>)}
                  {activity.outputs.map((output) => <th key={output.id} className="p-2">{label(output.labelVi, output.labelEn)} ({isEnglish ? output.unitEn : output.unitVi})</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.recordedAt}-${index}`} className="border-t border-border">
                    <td className="p-2">{index + 1}</td>
                    {[...activity.parameters, ...activity.outputs].map((item) => (
                      <td key={item.id} className="p-2">{row.values[item.id]?.toLocaleString(undefined, { maximumSignificantDigits: 6 })}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        {label("Số liệu chỉ lưu trong phiên thực hành này; hãy tải CSV để lưu hoặc nộp bài.", "Measurements stay in this practice session; download the CSV to keep or submit them.")}
      </p>
    </section>
  );
}

function ExternalSimulation({
  activity,
  mode,
}: {
  activity: Extract<CustomLabActivity, { type: "external" }>;
  mode: DisplayMode;
}) {
  let validUrl = false;
  try {
    const url = new URL(activity.url);
    const allowedHosts = ["phet.colorado.edu", "phet.colorado.org", "geogebra.org", "www.geogebra.org"];
    validUrl = url.protocol === "https:" && allowedHosts.includes(url.hostname.toLowerCase());
  } catch {
    validUrl = false;
  }
  const title = mode === "en" ? activity.titleEn || activity.titleVi : activity.titleVi || activity.titleEn;
  return (
    <section className="space-y-3 rounded-2xl border border-indigo-200/70 bg-background p-4 dark:border-indigo-900/60">
      <h3 className="font-bold">{title || (activity.provider === "phet" ? "PhET" : "GeoGebra")}</h3>
      {validUrl ? (
        <iframe
          src={activity.url}
          title={title || "External virtual lab"}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="fullscreen; clipboard-read; clipboard-write"
          className="h-[min(70vh,680px)] w-full rounded-xl border border-border bg-white"
        />
      ) : (
        <p role="alert" className="text-sm text-destructive">
          {mode === "en" ? "This simulation URL is not allowed." : "Đường dẫn mô phỏng không hợp lệ hoặc không được hỗ trợ."}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {mode === "en"
          ? "External simulations do not automatically send measurements to this lab."
          : "Mô phỏng bên ngoài không tự gửi số liệu về bảng đo của bài Lab."}
      </p>
    </section>
  );
}

export function CustomLabPlayer({ lab }: { lab: CustomLabRecord }) {
  const [mode, setMode] = useState<DisplayMode>("both");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [completedSimulations, setCompletedSimulations] = useState<number[]>([]);
  const [speechError, setSpeechError] = useState("");
  const simulationIndexes = lab.activities.reduce<number[]>((indexes, activity, index) => {
    if (activity.type === "simulation") indexes.push(index);
    return indexes;
  }, []);
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
      <article className="mx-auto max-w-4xl space-y-6">
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
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-blue-600" />
            {mode === "en" ? "Procedure" : "Các bước tiến hành"}
          </h2>
          <ol className="space-y-3">
            {lab.steps.map((step, index) => {
              const isComplete = completedSteps.includes(index);
              return (
                <li
                  key={index}
                  className={`flex gap-3 rounded-xl border p-3 ${step.safety ? "border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20" : "border-border"}`}
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
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px] font-bold">{index + 1}</span>}
                  </button>
                  <div className="min-w-0 flex-1 text-sm leading-relaxed">
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
                      <p className="mt-1 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                        {mode === "en" ? "Safety step" : "Bước an toàn"}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-muted-foreground">
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
            <h2 className="text-lg font-bold">{mode === "en" ? "Interactive activities" : "Hoạt động tương tác"}</h2>
            {lab.activities.map((activity, index) => {
              if (activity.type === "simulation") {
                return (
                  <SimulationCard
                    key={index}
                    activity={activity}
                    mode={mode}
                    onRecord={() => setCompletedSimulations((current) =>
                      current.includes(index) ? current : [...current, index],
                    )}
                  />
                );
              }
              if (activity.type === "external") {
                return <ExternalSimulation key={index} activity={activity} mode={mode} />;
              }
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
              return <ActivityCard key={index} activity={activity} mode={mode} index={index} />;
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
