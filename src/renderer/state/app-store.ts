import { useCallback, useMemo, useReducer } from "react";
import type { AppError } from "@shared/errors";
import type { AppEvent, RawPiEvent } from "@shared/events";
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
  ui: {
    projectLoading: boolean;
    bridgeReady: boolean | null;
  };
}

type AppAction =
  | { type: "bridge.ready"; ready: boolean }
  | { type: "project.loading"; loading: boolean }
  | { type: "project.snapshot"; snapshot: ProjectFolderSnapshot }
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
    projectPath: null
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
  ui: {
    projectLoading: false,
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

  const addError = useCallback((error: AppError) => {
    dispatch({ type: "error.add", error });
  }, []);

  const actions = useMemo(
    () => ({
      setBridgeReady,
      setProjectLoading,
      applyProject,
      addError
    }),
    [addError, applyProject, setBridgeReady, setProjectLoading]
  );

  return {
    state,
    actions
  };
}

export { initialState as initialAppState };
