import { useCallback, useMemo, useReducer } from "react";
import type { AppError } from "@shared/errors";
import type { AppEvent, RawPiEvent } from "@shared/events";
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
  rawEvents: RawPiEvent[];
  normalizedEvents: AppEvent[];
  errors: AppError[];
  piRuntime: PiRuntimeSnapshot;
  ui: {
    projectLoading: boolean;
    sessionLoading: boolean;
    bridgeReady: boolean | null;
  };
}

type AppAction =
  | { type: "bridge.ready"; ready: boolean }
  | { type: "project.loading"; loading: boolean }
  | { type: "project.snapshot"; snapshot: ProjectFolderSnapshot }
  | { type: "pi.runtime"; runtime: PiRuntimeSnapshot }
  | { type: "session.loading"; loading: boolean }
  | { type: "session.snapshot"; session: SessionSnapshot; error?: AppError | null; runtime?: PiRuntimeSnapshot }
  | { type: "error.add"; error: AppError };

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
  rawEvents: [
    {
      id: "raw-0001",
      sessionId: "session-preview",
      timestamp: "2026-05-15T17:00:00.000Z",
      type: "session.created",
      payload: { projectPath: "/Users/jdeheus/Documents/Gooey-Pi" }
    },
    {
      id: "raw-0002",
      sessionId: "session-preview",
      timestamp: "2026-05-15T17:01:04.000Z",
      type: "assistant.delta",
      payload: { delta: "Renderer-safe event placeholder" }
    }
  ],
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
    bridgeReady: null
  }
};

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

  const actions = useMemo(
    () => ({
      setBridgeReady,
      setProjectLoading,
      applyProject,
      setPiRuntime,
      setSessionLoading,
      applySession,
      addError
    }),
    [addError, applyProject, applySession, setBridgeReady, setPiRuntime, setProjectLoading, setSessionLoading]
  );

  return {
    state,
    actions
  };
}

export { initialState as initialAppState };
