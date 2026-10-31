import type { VirtualLabResult } from "./types";
import type { VirtualLabSessionStore } from "./state-store";

export class StudentResultCollector {
  constructor(private readonly store: VirtualLabSessionStore) {}

  collect(completed = false): VirtualLabResult {
    return this.store.getState().buildResult(
      completed ? new Date().toISOString() : null,
    );
  }

  download(completed = false) {
    const result = this.collect(completed);
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `virtual-lab-${result.sessionId}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return result;
  }
}
