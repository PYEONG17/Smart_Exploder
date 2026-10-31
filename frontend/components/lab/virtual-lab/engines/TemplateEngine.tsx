"use client";

import { VirtualLabTemplateRenderer } from "@/components/lab/virtual-lab/templates";
import type { EngineRendererProps } from "@/lib/virtual-lab/engine/types";

export default function TemplateEngine(props: EngineRendererProps) {
  if (props.activity.type !== "template") return null;
  return (
    <VirtualLabTemplateRenderer
      activity={props.activity}
      activityId={props.activityId}
      mode={props.mode}
      store={props.store}
    />
  );
}
