import { lazy, type ComponentType } from "react";
import type { EnginePlugin, EngineRendererProps, RegisteredEngine } from "./types";

export class EngineRegistry {
  private readonly plugins = new Map<string, RegisteredEngine>();

  register(plugin: EnginePlugin): void {
    if (!plugin.id.trim()) throw new Error("Simulation engine IDs cannot be empty.");
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Simulation engine already registered: ${plugin.id}`);
    }

    this.plugins.set(plugin.id, {
      ...plugin,
      component: lazy(plugin.load),
    });
  }

  resolve(id: string): ComponentType<EngineRendererProps> | undefined {
    return this.plugins.get(id)?.component;
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  list(): string[] {
    return [...this.plugins.keys()];
  }
}
