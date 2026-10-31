"use client";

import { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { virtualLabComponentRegistry } from "@/lib/virtual-lab/component-registry";
import { physicsEngine } from "@/lib/virtual-lab/physics-engine";
import type { EngineRendererProps } from "@/lib/virtual-lab/engine/types";

type DisplayMode = EngineRendererProps["mode"];
type MeasurementRow = {
  recordedAt: string;
  values: Record<string, number>;
};

function textFor(pair: { vi: string; en: string }, mode: DisplayMode) {
  if (mode === "vi") return pair.vi || pair.en;
  if (mode === "en") return pair.en || pair.vi;
  return [pair.vi, pair.en].filter(Boolean).join(" / ");
}

export default function SimulationEngine(props: EngineRendererProps) {
  if (props.activity.type !== "simulation") return null;
  return (
    <SimulationActivity
      activity={props.activity}
      activityId={props.activityId}
      mode={props.mode}
      onRecord={props.onRecord}
      store={props.store}
    />
  );
}

function SimulationActivity({
  activity,
  activityId,
  mode,
  onRecord,
  store,
}: {
  activity: Extract<EngineRendererProps["activity"], { type: "simulation" }>;
  activityId: string;
  mode: EngineRendererProps["mode"];
  onRecord: () => void;
  store: EngineRendererProps["store"];
}) {
  const [values, setValues] = useState<Record<string, number>>(
    () => Object.fromEntries(activity.parameters.map((parameter) => [parameter.id, parameter.initialValue])),
  );
  const [rows, setRows] = useState<MeasurementRow[]>([]);

  const componentDefinitions = useMemo(() => activity.components ?? [
    ...activity.parameters.map(({ id }) => ({
      id: `control-${id}`,
      type: "parameter-slider" as const,
      parameterId: id,
    })),
    ...activity.outputs.map(({ id }) => ({
      id: `result-${id}`,
      type: "numeric-output" as const,
      outputId: id,
    })),
  ], [activity.components, activity.outputs, activity.parameters]);
  const outputs = useMemo(() => {
    try {
      const evaluation = physicsEngine.evaluate({
        schemaVersion: 1,
        type: "simulation",
        domain: activity.domain ?? "mechanics",
        title: {
          vi: activity.titleVi || "Mô phỏng tương tác",
          en: activity.titleEn || "Interactive simulation",
        },
        description: {
          vi: activity.descriptionVi,
          en: activity.descriptionEn,
        },
        parameters: activity.parameters,
        outputs: activity.outputs,
        components: componentDefinitions,
      }, values);
      return activity.outputs.map((output) => ({
        ...output,
        value: evaluation.values[output.id],
        error: "",
      }));
    } catch (evaluationError) {
      const error = evaluationError instanceof Error ? evaluationError.message : "Invalid simulation configuration";
      return activity.outputs.map((output) => ({ ...output, value: null, error }));
    }
  }, [activity, componentDefinitions, values]);
  const computed = Object.fromEntries(
    outputs.flatMap((output) => output.value === null ? [] : [[output.id, output.value]]),
  );
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
    const measurementValues = {
      ...values,
      ...outputValues,
    };
    setRows((current) => [...current, {
      recordedAt: new Date().toISOString(),
      values: measurementValues,
    }]);
    store.getState().recordMeasurement(activityId, measurementValues);
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
        {activity.template ? (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            {activity.template.replaceAll("-", " ")}
          </p>
        ) : null}
        {activity.descriptionVi || activity.descriptionEn ? (
          <p className="mt-1 text-xs text-muted-foreground">{textFor({ vi: activity.descriptionVi, en: activity.descriptionEn }, mode)}</p>
        ) : null}
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-background p-4">
          <h4 className="text-sm font-bold">{label("Biến điều khiển", "Controls")}</h4>
          {componentDefinitions.filter(({ type }) => type === "parameter-slider").map((definition) => {
            const Component = virtualLabComponentRegistry.resolve(definition.type);
            if (!Component) return null;
            return (
              <Component
                key={definition.id}
                definition={definition}
                parameters={activity.parameters}
                outputs={activity.outputs}
                values={values}
                computed={computed}
                language={mode}
                onParameterChange={(id, value) => {
                  setValues((current) => ({ ...current, [id]: value }));
                  store.getState().setParameter(activityId, id, value);
                }}
              />
            );
          })}
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
          {outputs.some(({ error }) => error) ? (
            <p role="alert" className="text-xs text-destructive">
              {outputs.find(({ error }) => error)?.error}
            </p>
          ) : null}
          {componentDefinitions.filter(({ type }) => type === "numeric-output").map((definition) => {
            const Component = virtualLabComponentRegistry.resolve(definition.type);
            if (!Component) return null;
            return (
              <Component
                key={definition.id}
                definition={definition}
                parameters={activity.parameters}
                outputs={activity.outputs}
                values={values}
                computed={computed}
                language={mode}
                onParameterChange={(id, value) => {
                  setValues((current) => ({ ...current, [id]: value }));
                  store.getState().setParameter(activityId, id, value);
                }}
              />
            );
          })}
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
