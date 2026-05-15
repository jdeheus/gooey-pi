import { useCallback, useMemo, useReducer } from "react";
import type { AppError } from "@shared/errors";
import type { AppEvent, DiagnosticResult, EventStreamMessage, EventStreamSnapshot, RawPiEvent } from "@shared/events";
import type { PiRuntimeSnapshot } from "@shared/pi";
import type { ProjectFolderSnapshot, ProjectFolderState } from "@shared/project";
import type { SessionSnapshot } from "@shared/session";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status: "draft" | "submitted" | "streaming" | "complete" | "errored" | "stopped";
}

export interface AppState {
  project: ProjectFolderState;
  session: SessionSnapshot;
  messages: ChatMessage[];
  diagnostics: DiagnosticResult[];
  rawEvents: RawPiEvent[];
  normalizedEvents: AppEvent[];
  errors: AppError[];
  piRuntime: PiRuntimeSnapshot;
  ui: {
    projectLoading: boolean;
    sessionLoading: boolean;
    bridgeReady: boolean | null;
    dismissedErrorIds: string[];
  };
}

type AppAction =
  | { type: "bridge.ready"; ready: boolean }
  | { type: "project.loading"; loading: boolean }
  | { type: "project.snapshot"; snapshot: ProjectFolderSnapshot }
  | { type: "pi.runtime"; runtime: PiRuntimeSnapshot }
  | { type: "session.loading"; loading: boolean }
  | { type: "session.snapshot"; session: SessionSnapshot; error?: AppError | null; runtime?: PiRuntimeSnapshot }
  | { type: "error.add"; error: AppError }
  | { type: "error.dismiss"; errorId: string }
  | { type: "events.snapshot"; snapshot: EventStreamSnapshot }
  | { type: "events.message"; message: EventStreamMessage };

const MAX_EVENTS = 500;

const initialProjectState: ProjectFolderState = {
  path: null,
  valid: false,
  restored: false,
  errorId: null,
  checking: false,
  isGitRepository: false,
  canRead: false,
  canWrite: false
};

const initialState: AppState = {
  project: initialProjectState,
  session: {
    id: null,
    status: "idle",
    projectPath: null,
    sessionFile: null,
    errorId: null
  },
  messages: [],
  diagnostics: [],
  rawEvents: [],
  normalizedEvents: [],
  errors: [],
  piRuntime: {
    status: "unchecked",
    packageName: "@earendil-works/pi-coding-agent",
    packageVersion: "0.74.0",
    checkedAt: null,
    errorId: null,
    error: null
  },
  ui: {
    projectLoading: false,
    sessionLoading: false,
    bridgeReady: null,
    dismissedErrorIds: []
  }
};

function appendUniqueBounded<T extends { id: string }>(items: T[], item: T): T[] {
  return [...items.filter((existing) => existing.id !== item.id), item].slice(-MAX_EVENTS);
}

function applyEventSnapshot(state: AppState, snapshot: EventStreamSnapshot): AppState {
  return {
    ...state,
    rawEvents: snapshot.rawEvents,
    normalizedEvents: snapshot.appEvents,
    messages: buildMessagesFromEvents(snapshot.appEvents),
    diagnostics: buildDiagnosticsFromEvents(snapshot.appEvents),
    errors: snapshot.errors
  };
}

function applyEventMessage(state: AppState, message: EventStreamMessage): AppState {
  switch (message.type) {
    case "raw":
      return {
        ...state,
        rawEvents: appendUniqueBounded(state.rawEvents, message.rawEvent)
      };
    case "app":
      if (state.normalizedEvents.some((event) => event.id === message.appEvent.id)) {
        return state;
      }

      return {
        ...state,
        normalizedEvents: appendUniqueBounded(state.normalizedEvents, message.appEvent),
        diagnostics: applyAppEventToDiagnostics(state.diagnostics, message.appEvent),
        messages: applyAppEventToMessages(state.messages, message.appEvent)
      };
    case "error":
      return {
        ...state,
        errors: appendUniqueBounded(state.errors, message.error)
      };
    case "session":
      return {
        ...state,
        session: message.session
      };
    case "cleared":
      return applyEventSnapshot(state, message.snapshot);
    default:
      return state;
  }
}

function buildMessagesFromEvents(events: AppEvent[]): ChatMessage[] {
  return events.reduce<ChatMessage[]>((messages, event) => applyAppEventToMessages(messages, event), []);
}

function buildDiagnosticsFromEvents(events: AppEvent[]): DiagnosticResult[] {
  return events.reduce<DiagnosticResult[]>((diagnostics, event) => applyAppEventToDiagnostics(diagnostics, event), []);
}

function applyAppEventToDiagnostics(diagnostics: DiagnosticResult[], event: AppEvent): DiagnosticResult[] {
  if (event.kind !== "diagnostic.result") {
    return diagnostics;
  }

  return appendUniqueBounded(diagnostics, event.diagnostic);
}

function applyAppEventToMessages(messages: ChatMessage[], event: AppEvent): ChatMessage[] {
  switch (event.kind) {
    case "message.user":
      if (messages.some((message) => message.id === event.messageId)) {
        return messages;
      }

      return [
        ...messages,
        {
          id: event.messageId,
          role: "user",
          content: event.content,
          createdAt: event.timestamp,
          status: "submitted"
        }
      ];
    case "message.assistant.delta": {
      const existing = messages.find((message) => message.id === event.messageId);

      if (!existing) {
        return [
          ...messages,
          {
            id: event.messageId,
            role: "assistant",
            content: event.delta,
            createdAt: event.timestamp,
            status: "streaming"
          }
        ];
      }

      return messages.map((message) =>
        message.id === event.messageId
          ? {
              ...message,
              content: `${message.content}${event.delta}`,
              status: "streaming"
            }
          : message
      );
    }
    case "message.assistant.complete":
      if (!messages.some((message) => message.id === event.messageId)) {
        return [
          ...messages,
          {
            id: event.messageId,
            role: "assistant",
            content: "",
            createdAt: event.timestamp,
            status: "complete"
          }
        ];
      }

      return messages.map((message) =>
        message.id === event.messageId
          ? {
              ...message,
              status: "complete"
            }
          : message
      );
    case "error.created":
      return messages.map((message) =>
        message.role === "assistant" && message.status === "streaming"
          ? {
              ...message,
              status: "errored"
            }
          : message
      );
    case "session.status":
      if (event.status === "stopped") {
        return messages.map((message) =>
          message.role === "assistant" && message.status === "streaming"
            ? {
                ...message,
                status: "stopped"
              }
            : message
        );
      }

      if (event.status === "errored") {
        return messages.map((message) =>
          message.role === "assistant" && message.status === "streaming"
            ? {
                ...message,
                status: "errored"
              }
            : message
        );
      }

      return messages;
    default:
      return messages;
  }
}

function applyProjectSnapshot(state: AppState, snapshot: ProjectFolderSnapshot): AppState {
  const errors = snapshot.error
    ? [...state.errors.filter((error) => error.id !== snapshot.error?.id), snapshot.error]
    : state.errors;

  return {
    ...state,
    project: snapshot.state,
    session: {
      ...state.session,
      projectPath: snapshot.state.valid ? snapshot.state.path : null
    },
    errors,
    ui: {
      ...state.ui,
      projectLoading: false
    }
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "bridge.ready":
      return {
        ...state,
        ui: {
          ...state.ui,
          bridgeReady: action.ready
        }
      };
    case "project.loading":
      return {
        ...state,
        project: {
          ...state.project,
          checking: action.loading
        },
        ui: {
          ...state.ui,
          projectLoading: action.loading
        }
      };
    case "project.snapshot":
      return applyProjectSnapshot(state, action.snapshot);
    case "pi.runtime":
      return {
        ...state,
        piRuntime: action.runtime,
        errors: action.runtime.error
          ? [...state.errors.filter((error) => error.id !== action.runtime.error?.id), action.runtime.error]
          : state.errors
      };
    case "session.loading":
      return {
        ...state,
        ui: {
          ...state.ui,
          sessionLoading: action.loading
        }
      };
    case "session.snapshot": {
      const errors = action.error
        ? [...state.errors.filter((error) => error.id !== action.error?.id), action.error]
        : state.errors;

      return {
        ...state,
        session: action.session,
        piRuntime: action.runtime ?? state.piRuntime,
        errors,
        ui: {
          ...state.ui,
          sessionLoading: false
        }
      };
    }
    case "error.add":
      return {
        ...state,
        errors: [...state.errors.filter((error) => error.id !== action.error.id), action.error]
      };
    case "error.dismiss":
      return {
        ...state,
        ui: {
          ...state.ui,
          dismissedErrorIds: [...state.ui.dismissedErrorIds.filter((id) => id !== action.errorId), action.errorId]
        }
      };
    case "events.snapshot":
      return applyEventSnapshot(state, action.snapshot);
    case "events.message":
      return applyEventMessage(state, action.message);
    default:
      return state;
  }
}

export function useAppStore() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setBridgeReady = useCallback((ready: boolean) => {
    dispatch({ type: "bridge.ready", ready });
  }, []);

  const setProjectLoading = useCallback((loading: boolean) => {
    dispatch({ type: "project.loading", loading });
  }, []);

  const applyProject = useCallback((snapshot: ProjectFolderSnapshot) => {
    dispatch({ type: "project.snapshot", snapshot });
  }, []);

  const setPiRuntime = useCallback((runtime: PiRuntimeSnapshot) => {
    dispatch({ type: "pi.runtime", runtime });
  }, []);

  const setSessionLoading = useCallback((loading: boolean) => {
    dispatch({ type: "session.loading", loading });
  }, []);

  const applySession = useCallback(
    (session: SessionSnapshot, error?: AppError | null, runtime?: PiRuntimeSnapshot) => {
      dispatch({ type: "session.snapshot", session, error, runtime });
    },
    []
  );

  const addError = useCallback((error: AppError) => {
    dispatch({ type: "error.add", error });
  }, []);

  const dismissError = useCallback((errorId: string) => {
    dispatch({ type: "error.dismiss", errorId });
  }, []);

  const applyEventStreamSnapshot = useCallback((snapshot: EventStreamSnapshot) => {
    dispatch({ type: "events.snapshot", snapshot });
  }, []);

  const applyEventStreamMessage = useCallback((message: EventStreamMessage) => {
    dispatch({ type: "events.message", message });
  }, []);

  const actions = useMemo(
    () => ({
      setBridgeReady,
      setProjectLoading,
      applyProject,
      setPiRuntime,
      setSessionLoading,
      applySession,
      addError,
      dismissError,
      applyEventStreamSnapshot,
      applyEventStreamMessage
    }),
    [
      addError,
      applyEventStreamMessage,
      applyEventStreamSnapshot,
      applyProject,
      applySession,
      dismissError,
      setBridgeReady,
      setPiRuntime,
      setProjectLoading,
      setSessionLoading
    ]
  );

  return {
    state,
    actions
  };
}

export { initialState as initialAppState };
