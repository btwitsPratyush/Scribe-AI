import { setup, assign } from "xstate";

/* ----------------------------- Type Definitions ----------------------------- */
export type RecordingType = "mic" | "tab" | "both" | null;

export type RecordingEvent =
  | { type: "START"; mode: RecordingType }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "TRANSCRIBE"; text: string }
  | { type: "COMPLETED"; sessionId: string; downloadUrl: string; summary?: string }
  | { type: "ERROR"; message: string }
  | { type: "RESET" }
  | { type: "SET_USER_ID"; userId: string }
  | { type: "SESSION_STARTED"; sessionId: string }
  | { type: "TICK" }
  | { type: "LOAD_SESSION"; session: any };

export interface RecordingContext {
  transcription: string;
  userId: string;
  error: string | null;
  recordingType: RecordingType | "both";
  sessionId: string | null;
  downloadUrl: string | null;
  summary: string | null;
  duration: number;
}

/* ----------------------------- XState Machine ----------------------------- */
export const recordingMachine = setup({
  types: {
    context: {} as RecordingContext,
    events: {} as RecordingEvent,
  },
  actions: {
    setRecordingType: assign(({ event }) => {
      if (event.type === "START") {
        return {
          recordingType: event.mode,
          error: null,
          transcription: "",
          duration: 0,
        };
      }
      return {};
    }),
    setUserId: assign(({ event }) => {
      if (event.type === "SET_USER_ID") return { userId: event.userId };
      return {};
    }),
    appendTranscription: assign(({ context, event }) => {
      if (event.type === "TRANSCRIBE") {
        return { transcription: context.transcription + " " + event.text };
      }
      return {};
    }),
    handleCompletion: assign(({ event }) => {
      if (event.type === "COMPLETED") {
        return {
          sessionId: event.sessionId,
          downloadUrl: event.downloadUrl,
          summary: event.summary || null,
        };
      }
      return {};
    }),
    loadSessionData: assign(({ event }) => {
      if (event.type === "LOAD_SESSION") {
        return {
          transcription: event.session.transcript || "",
          sessionId: event.session.id,
          downloadUrl: event.session.downloadUrl || null,
          duration: event.session.duration || 0,
          error: null,
        };
      }
      return {};
    }),
    setError: assign(({ event }) => {
      if (event.type === "ERROR") return { error: event.message };
      return {};
    }),
    resetState: assign(() => ({
      transcription: "",
      error: null,
      recordingType: null,
      sessionId: null,
      downloadUrl: null,
      summary: null,
      duration: 0,
    })),
    setSessionId: assign(({ event }) => {
      if (event.type === "SESSION_STARTED") return { sessionId: event.sessionId };
      return {};
    }),
    incrementDuration: assign(({ context }) => ({
      duration: context.duration + 1,
    })),
  },
}).createMachine({
  id: "recording",
  initial: "idle",
  context: {
    transcription: "",
    userId: "guest_user_123",
    error: null,
    recordingType: null,
    sessionId: null,
    downloadUrl: null,
    summary: null,
    duration: 0,
  },
  states: {
    idle: {
      on: {
        START: { target: "recording", actions: "setRecordingType" },
        SET_USER_ID: { actions: "setUserId" },
        ERROR: { target: "error", actions: "setError" },
        LOAD_SESSION: { target: "completed", actions: "loadSessionData" },
        TRANSCRIBE: { actions: "appendTranscription" },
      },
    },
    recording: {
      on: {
        PAUSE: { target: "paused" },
        STOP: { target: "processing" },
        TRANSCRIBE: { actions: "appendTranscription" },
        ERROR: { target: "error", actions: "setError" },
        SESSION_STARTED: { actions: "setSessionId" },
        TICK: { actions: "incrementDuration" },
      },
    },
    paused: {
      on: {
        RESUME: { target: "recording" },
        STOP: { target: "processing" },
        ERROR: { target: "error", actions: "setError" },
      },
    },
    processing: {
      on: {
        COMPLETED: { target: "completed", actions: "handleCompletion" },
        ERROR: { target: "error", actions: "setError" },
        TRANSCRIBE: { actions: "appendTranscription" },
      },
    },
    completed: {
      on: {
        RESET: { target: "idle", actions: "resetState" },
        LOAD_SESSION: { actions: "loadSessionData" },
        START: { target: "recording", actions: "setRecordingType" },
      },
    },
    error: {
      on: {
        RESET: { target: "idle", actions: "resetState" },
        START: { target: "recording", actions: "setRecordingType" },
        STOP: { target: "idle", actions: ["resetState", "setError"] },
        LOAD_SESSION: { target: "completed", actions: "loadSessionData" },
      },
    },
  },
});