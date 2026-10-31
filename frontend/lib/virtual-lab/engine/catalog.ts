import { EngineRegistry } from "./registry";

const loadSimulationEngine = () => import("@/components/lab/virtual-lab/engines/SimulationEngine");
const loadInteractionEngine = () => import("@/components/lab/virtual-lab/engines/InteractionEngine");
const loadTemplateEngine = () => import("@/components/lab/virtual-lab/engines/TemplateEngine");
const loadExternalEngine = () => import("@/components/lab/virtual-lab/engines/ExternalEngine");

export const simulationEngineRegistry = new EngineRegistry();

for (const domain of ["science", "electricity", "mechanics", "fluids", "thermal"] as const) {
  simulationEngineRegistry.register({
    id: `simulation:${domain}`,
    load: loadSimulationEngine,
  });
}

for (const type of ["observe", "slider", "switch", "quiz"] as const) {
  simulationEngineRegistry.register({
    id: `interaction:${type}`,
    load: loadInteractionEngine,
  });
}

for (const template of [
  "drag-drop",
  "matching",
  "labeling",
  "timeline",
  "image-quiz",
  "diagram",
] as const) {
  simulationEngineRegistry.register({
    id: `template:${template}`,
    load: loadTemplateEngine,
  });
}

for (const provider of ["phet", "geogebra"] as const) {
  simulationEngineRegistry.register({
    id: `external:${provider}`,
    load: loadExternalEngine,
  });
}
