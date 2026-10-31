import type { VirtualLabEvent } from "./types";

type LabEventListener = (event: VirtualLabEvent) => void;

export class EventEngine {
  private readonly listeners = new Set<LabEventListener>();

  subscribe(listener: LabEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: VirtualLabEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Virtual Lab event listener failed.", error);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }

  get listenerCount() {
    return this.listeners.size;
  }
}
