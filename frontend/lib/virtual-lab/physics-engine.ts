import { evaluateFormula } from "./formula-engine";
import type { VirtualLabSimulationDefinition } from "./types";

export type PhysicsEvaluation = {
  values: Record<string, number>;
  warnings: string[];
};

const DOMAIN_RULES: Record<VirtualLabSimulationDefinition["domain"], {
  maximumParameters: number;
  maximumOutputs: number;
}> = {
  science: { maximumParameters: 12, maximumOutputs: 12 },
  electricity: { maximumParameters: 12, maximumOutputs: 12 },
  mechanics: { maximumParameters: 12, maximumOutputs: 12 },
  fluids: { maximumParameters: 12, maximumOutputs: 12 },
  thermal: { maximumParameters: 12, maximumOutputs: 12 },
};

export class PhysicsEngine {
  evaluate(
    definition: VirtualLabSimulationDefinition,
    parameters: Record<string, number>,
  ): PhysicsEvaluation {
    const rules = DOMAIN_RULES[definition.domain];
    if (definition.parameters.length > rules.maximumParameters || definition.outputs.length > rules.maximumOutputs) {
      throw new Error(`Simulation exceeds configured limits for ${definition.domain}.`);
    }

    const warnings: string[] = [];
    for (const parameter of definition.parameters) {
      const value = parameters[parameter.id];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Invalid value for parameter ${parameter.id}.`);
      }
      if (value < parameter.min || value > parameter.max) {
        throw new Error(`Parameter ${parameter.id} is outside the configured range.`);
      }
    }

    const values: Record<string, number> = {};
    for (const output of definition.outputs) {
      const value = evaluateFormula(output.formula, parameters);
      if (!Number.isFinite(value)) {
        throw new Error(`Formula for output ${output.id} returned a non-finite value.`);
      }
      values[output.id] = value;
      if (value < 0 && ["electricity", "mechanics", "fluids", "thermal"].includes(definition.domain)) {
        warnings.push(`${output.id} is negative; check the experiment's sign convention.`);
      }
    }
    return { values, warnings };
  }
}

export const physicsEngine = new PhysicsEngine();
