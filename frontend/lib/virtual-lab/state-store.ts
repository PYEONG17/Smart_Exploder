import { createStore, type StoreApi } from "zustand/vanilla";
import type { VirtualLabEvent, VirtualLabResult } from "./types";
import { EventEngine } from "./event-engine";

export type MeasurementRow = {
  recordedAt: string;
  values: Record<string, number>;
};

export type VirtualLabSessionState = {
  labId: string;
  sessionId: string;
  startedAt: string;
  parameterValues: Record<string, Record<string, number>>;
  measurements: Record<string, MeasurementRow[]>;
  matches: Record<string, Record<string, string>>;
  quizAnswers: Record<string, number>;
  events: VirtualLabEvent[];
  activityScores: Record<string, number>;
  score: number | null;
  setParameter: (activityId: string, parameterId: string, value: number) => void;
  recordMeasurement: (activityId: string, values: Record<string, number>) => void;
  submitMatches: (activityId: string, matches: Record<string, string>, score: number) => void;
  answerQuiz: (activityId: string, answer: number, correct: boolean) => void;
  buildResult: (completedAt?: string | null) => VirtualLabResult;
};

export type VirtualLabSessionStore = StoreApi<VirtualLabSessionState> & {
  eventBus: EventEngine;
};

const createSessionId = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("Trình duyệt không hỗ trợ tạo mã phiên thực hành an toàn.");
  }
  return globalThis.crypto.randomUUID();
};

function aggregateScores(activityScores: Record<string, number>): number | null {
  const scores = Object.values(activityScores);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

export function createVirtualLabSessionStore(labId: string): VirtualLabSessionStore {
  const eventBus = new EventEngine();
  const store = createStore<VirtualLabSessionState>((set, get) => ({
    labId,
    sessionId: createSessionId(),
    startedAt: new Date().toISOString(),
    parameterValues: {},
    measurements: {},
    matches: {},
    quizAnswers: {},
    events: [],
    activityScores: {},
    score: null,
    setParameter: (activityId, parameterId, value) => {
      const occurredAt = new Date().toISOString();
      const event: VirtualLabEvent = { type: "parameter.changed", activityId, parameterId, value, occurredAt };
      set((state) => ({
        parameterValues: {
          ...state.parameterValues,
          [activityId]: { ...state.parameterValues[activityId], [parameterId]: value },
        },
        events: [...state.events, event],
      }));
      eventBus.emit(event);
    },
    recordMeasurement: (activityId, values) => {
      const occurredAt = new Date().toISOString();
      const event: VirtualLabEvent = { type: "measurement.recorded", activityId, values, occurredAt };
      set((state) => ({
        measurements: {
          ...state.measurements,
          [activityId]: [
            ...(state.measurements[activityId] ?? []),
            { recordedAt: occurredAt, values },
          ],
        },
        events: [...state.events, event],
      }));
      eventBus.emit(event);
    },
    submitMatches: (activityId, matches, score) => {
      const occurredAt = new Date().toISOString();
      const event: VirtualLabEvent = { type: "drag-drop.submitted", activityId, matches, score, occurredAt };
      set((state) => {
        const activityScores = { ...state.activityScores, [activityId]: score };
        return {
          matches: { ...state.matches, [activityId]: matches },
          activityScores,
          score: aggregateScores(activityScores),
          events: [...state.events, event],
        };
      });
      eventBus.emit(event);
    },
    answerQuiz: (activityId, answer, correct) => {
      const occurredAt = new Date().toISOString();
      const event: VirtualLabEvent = { type: "quiz.answered", activityId, answer, correct, occurredAt };
      set((state) => {
        const activityScores = { ...state.activityScores, [activityId]: correct ? 100 : 0 };
        return {
          quizAnswers: { ...state.quizAnswers, [activityId]: answer },
          activityScores,
          score: aggregateScores(activityScores),
          events: [...state.events, event],
        };
      });
      eventBus.emit(event);
    },
    buildResult: (completedAt = null) => {
      const state = get();
      return {
        schemaVersion: 1,
        labId: state.labId,
        sessionId: state.sessionId,
        startedAt: state.startedAt,
        completedAt,
        measurements: Object.entries(state.measurements).flatMap(([activityId, rows]) =>
          rows.map((row) => ({ ...row, activityId })),
        ),
        events: state.events,
        activityScores: state.activityScores,
        score: state.score,
      };
    },
  }));
  return Object.assign(store, { eventBus });
}
