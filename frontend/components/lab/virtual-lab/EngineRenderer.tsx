"use client";

import { Component, Suspense, createElement, useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { CustomLabActivity } from "@/types/custom-lab";
import { simulationEngineRegistry } from "@/lib/virtual-lab/engine/catalog";
import type { EngineRendererProps } from "@/lib/virtual-lab/engine/types";

type Props = EngineRendererProps & {
  activity: CustomLabActivity;
};

type BoundaryState = { error: Error | null };

class EngineErrorBoundary extends Component<
  { children: ReactNode; language: EngineRendererProps["mode"] },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Simulation engine failed to render.", error);
  }

  render() {
    if (this.state.error) {
      return (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {this.props.language === "en"
            ? "This lab engine could not be loaded. Please try again later."
            : "Không thể tải bộ mô phỏng này. Vui lòng thử lại sau."}
        </p>
      );
    }
    return this.props.children;
  }
}

function engineIdFor(activity: CustomLabActivity): string {
  if (activity.type === "simulation") {
    return `simulation:${activity.domain ?? "mechanics"}`;
  }
  if (activity.type === "template") return `template:${activity.template}`;
  if (activity.type === "external") return `external:${activity.provider}`;
  return `interaction:${activity.type}`;
}

export function EngineRenderer(props: Props) {
  const { activity, mode } = props;
  const reducedMotion = useReducedMotion();
  const engineId = engineIdFor(activity);
  const Engine = simulationEngineRegistry.resolve(engineId);
  const animation = activity.animation;
  const variants = useMemo(() => {
    if (!animation || animation.entrance === "none" || reducedMotion) {
      return { initial: { opacity: 1, y: 0, scale: 1 } };
    }
    const initial = animation.entrance === "rise"
      ? { opacity: 0, y: 16, scale: 1 }
      : animation.entrance === "pop"
        ? { opacity: 0, y: 0, scale: 0.96 }
        : { opacity: 0, y: 0, scale: 1 };
    return { initial, animate: { opacity: 1, y: 0, scale: 1 } };
  }, [animation, reducedMotion]);

  if (!Engine) {
    return (
      <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
        {mode === "en" ? `No engine is registered for ${engineId}.` : `Chưa đăng ký engine ${engineId}.`}
      </p>
    );
  }

  const duration = reducedMotion || animation?.entrance === "none"
    ? 0
    : Math.min(Math.max(animation?.durationMs ?? 250, 0), 2000) / 1000;
  const delay = reducedMotion ? 0 : Math.min(Math.max(animation?.delayMs ?? 0, 0), 1000) / 1000;

  return (
    <EngineErrorBoundary language={mode}>
      <motion.div
        initial={variants.initial}
        animate={"animate" in variants ? variants.animate : undefined}
        transition={{ duration, delay, ease: "easeOut" }}
      >
        <Suspense
          fallback={
            <div className="animate-pulse rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground" aria-live="polite">
              {mode === "en" ? "Loading simulation..." : "Đang tải mô phỏng..."}
            </div>
          }
        >
          {createElement(Engine, props)}
        </Suspense>
      </motion.div>
    </EngineErrorBoundary>
  );
}

export const SimulationRenderer = EngineRenderer;
