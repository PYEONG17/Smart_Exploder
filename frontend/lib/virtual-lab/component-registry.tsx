"use client";

import type { ComponentType } from "react";
import type {
  VirtualLabComponentDefinition,
  VirtualLabOutput,
  VirtualLabParameter,
} from "@/types/custom-lab";

export type ComponentViewProps = {
  definition: VirtualLabComponentDefinition;
  parameters: VirtualLabParameter[];
  outputs: VirtualLabOutput[];
  values: Record<string, number>;
  computed: Partial<Record<string, number>>;
  language: "vi" | "en" | "both";
  onParameterChange: (id: string, value: number) => void;
};

export type VirtualLabComponentType = VirtualLabComponentDefinition["type"];

function bilingual(vi: string, en: string, language: ComponentViewProps["language"]) {
  return language === "both" ? `${vi} / ${en}` : language === "en" ? en : vi;
}

function ParameterSlider({ definition, parameters, values, language, onParameterChange }: ComponentViewProps) {
  if (definition.type !== "parameter-slider") return null;
  const parameter = parameters.find(({ id }) => id === definition.parameterId);
  if (!parameter) return null;
  const unit = language === "en" ? parameter.unitEn : parameter.unitVi;
  return (
    <label className="block space-y-2 rounded-xl border border-border bg-background p-3 text-xs">
      <span className="flex items-center justify-between gap-2 font-semibold">
        <span>{bilingual(parameter.labelVi, parameter.labelEn, language)}</span>
        <span>{values[parameter.id]} {unit}</span>
      </span>
      <input
        type="range"
        min={parameter.min}
        max={parameter.max}
        step={parameter.step}
        value={values[parameter.id]}
        onChange={(event) => onParameterChange(parameter.id, Number(event.target.value))}
        className="w-full accent-cyan-600"
        aria-label={bilingual(parameter.labelVi, parameter.labelEn, language)}
      />
      <span className="flex justify-between text-[10px] text-muted-foreground">
        <span>{parameter.min}</span><span>{parameter.max}</span>
      </span>
    </label>
  );
}

function NumericOutput({ definition, outputs, computed, language }: ComponentViewProps) {
  if (definition.type !== "numeric-output") return null;
  const output = outputs.find(({ id }) => id === definition.outputId);
  if (!output) return null;
  const unit = language === "en" ? output.unitEn : output.unitVi;
  const value = computed[output.id];
  return (
    <div className="rounded-xl bg-cyan-50 p-3 dark:bg-cyan-950/30">
      <p className="text-xs text-muted-foreground">
        {bilingual(output.labelVi, output.labelEn, language)}
      </p>
      <p className="mt-1 text-xl font-black">
        {value === undefined
          ? "—"
          : `${value.toLocaleString(undefined, { maximumSignificantDigits: 6 })} ${unit}`}
      </p>
      <p className="text-[10px] text-muted-foreground">{output.id} = {output.formula}</p>
    </div>
  );
}

export class ComponentRegistry {
  private readonly components = new Map<VirtualLabComponentType, ComponentType<ComponentViewProps>>();

  register(type: VirtualLabComponentType, component: ComponentType<ComponentViewProps>) {
    if (this.components.has(type)) {
      throw new Error(`Virtual Lab component already registered: ${type}`);
    }
    this.components.set(type, component);
  }

  resolve(type: VirtualLabComponentType) {
    return this.components.get(type);
  }
}

export const virtualLabComponentRegistry = new ComponentRegistry();
virtualLabComponentRegistry.register("parameter-slider", ParameterSlider);
virtualLabComponentRegistry.register("numeric-output", NumericOutput);
