import type { ComponentType, LazyExoticComponent } from "react";
import type { CustomLabActivity } from "@/types/custom-lab";
import type { VirtualLabSessionStore } from "../state-store";

export type LabLanguage = "vi" | "en" | "both";

export type EngineRendererProps = {
  activity: CustomLabActivity;
  activityId: string;
  mode: LabLanguage;
  store: VirtualLabSessionStore;
  index: number;
  onRecord: () => void;
};

export type EngineModule = {
  default: ComponentType<EngineRendererProps>;
};

export type EngineLoader = () => Promise<EngineModule>;

export type EnginePlugin = {
  id: string;
  load: EngineLoader;
};

export type RegisteredEngine = EnginePlugin & {
  component: LazyExoticComponent<ComponentType<EngineRendererProps>>;
};
