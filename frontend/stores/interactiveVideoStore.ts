import { create } from "zustand";
import type { InteractiveActivity } from "@/types";

export type VideoEnginePhase =
  | "READY"
  | "PLAYING"
  | "PAUSED_BY_USER"
  | "EVENT_ACTIVE"
  | "SUBMITTING"
  | "FEEDBACK"
  | "ENDED";

interface InteractiveVideoState {
  videoId: string | null;
  activeEvent: InteractiveActivity | null;
  completedEventIds: Set<string>;
  wrongAttempts: Record<string, number>;
  eventStartedAt: number | null;
  phase: VideoEnginePhase;
  startSession: (videoId: string) => void;
  setPhase: (phase: VideoEnginePhase) => void;
  activateEvent: (event: InteractiveActivity) => void;
  completeActiveEvent: () => void;
  cancelActiveEvent: () => void;
  recordWrongAttempt: (activityId: string) => void;
  rearmEvents: (activityIds: string[]) => void;
  clearSession: () => void;
}

export const useInteractiveVideoStore = create<InteractiveVideoState>((set) => ({
  videoId: null,
  activeEvent: null,
  completedEventIds: new Set<string>(),
  wrongAttempts: {},
  eventStartedAt: null,
  phase: "READY",
  startSession: (videoId) =>
    set({
      videoId,
      activeEvent: null,
      completedEventIds: new Set<string>(),
      wrongAttempts: {},
      eventStartedAt: null,
      phase: "READY",
    }),
  setPhase: (phase) => set({ phase }),
  activateEvent: (activeEvent) =>
    set({
      activeEvent,
      eventStartedAt: Date.now(),
      phase: "EVENT_ACTIVE",
    }),
  completeActiveEvent: () =>
    set((state) => {
      const completedEventIds = new Set(state.completedEventIds);
      if (state.activeEvent) completedEventIds.add(state.activeEvent.id);
      return {
        completedEventIds,
        activeEvent: null,
        eventStartedAt: null,
        phase: "PLAYING",
      };
    }),
  recordWrongAttempt: (activityId) =>
    set((state) => ({
      wrongAttempts: {
        ...state.wrongAttempts,
        [activityId]: (state.wrongAttempts[activityId] ?? 0) + 1,
      },
    })),
  rearmEvents: (activityIds) =>
    set((state) => {
      if (!activityIds.length) return state;
      const completedEventIds = new Set(state.completedEventIds);
      const wrongAttempts = { ...state.wrongAttempts };
      for (const id of activityIds) {
        completedEventIds.delete(id);
        delete wrongAttempts[id];
      }
      return { completedEventIds, wrongAttempts };
    }),
  cancelActiveEvent: () =>
    set({ activeEvent: null, eventStartedAt: null, phase: "PLAYING" }),
  clearSession: () =>
    set({
      videoId: null,
      activeEvent: null,
      completedEventIds: new Set<string>(),
      wrongAttempts: {},
      eventStartedAt: null,
      phase: "READY",
    }),
}));
