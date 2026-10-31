import type {
  BilingualText,
  VirtualLabDomain,
  VirtualLabOutput,
  VirtualLabParameter,
} from "@/types/custom-lab";

export type VirtualLabComponentDefinition =
  | { id: string; type: "parameter-slider"; parameterId: string }
  | { id: string; type: "numeric-output"; outputId: string };

export type VirtualLabSimulationDefinition = {
  schemaVersion: 1;
  type: "simulation";
  domain: VirtualLabDomain;
  title: BilingualText;
  description: BilingualText;
  parameters: VirtualLabParameter[];
  outputs: VirtualLabOutput[];
  components: VirtualLabComponentDefinition[];
};

export type VirtualLabDragDropDefinition = {
  schemaVersion: 1;
  type: "drag-drop";
  title: BilingualText;
  instructions: BilingualText;
  items: Array<BilingualText & { id: string }>;
  targets: Array<BilingualText & { id: string }>;
  correctMatches: Record<string, string>;
};

export type VirtualLabEvent =
  | { type: "parameter.changed"; activityId: string; parameterId: string; value: number; occurredAt: string }
  | { type: "measurement.recorded"; activityId: string; values: Record<string, number>; occurredAt: string }
  | { type: "drag-drop.submitted"; activityId: string; matches: Record<string, string>; score: number; occurredAt: string }
  | { type: "quiz.answered"; activityId: string; answer: number; correct: boolean; occurredAt: string };

export type VirtualLabResult = {
  schemaVersion: 1;
  labId: string;
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  measurements: Array<{ activityId: string; recordedAt: string; values: Record<string, number> }>;
  events: VirtualLabEvent[];
  activityScores: Record<string, number>;
  score: number | null;
};
