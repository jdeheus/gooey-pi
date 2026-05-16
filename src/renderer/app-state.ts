import { useCallback, useEffect, useMemo, useState } from "react";
import type { GooeyPiApi } from "@shared/app-api";
import type { AppEvent, EventStreamMessage, EventStreamSnapshot } from "@shared/events";
import type { PiModelCatalog, PiRuntimeSnapshot } from "@shared/pi";
import type { ProjectFolderSnapshot, SelectProjectFolderResult } from "@shared/project";
import type { SessionSnapshot } from "@shared/session";
import type { ChatItem, ChatSessionMetrics } from "@shared/chat";
import type {
  AppFrameActionHandlers,
  AppFrameSurfaceKind,
  DiagnosticsEvent,
  SessionPanelStep,
  SidebarProject
} from "@renderer/surfaces/app-frame";
import { CHAT_BODY_DEFAULT_METRICS } from "@renderer/surfaces/chat-body";

export interface RendererAppFrameState {
  chatItems: ChatItem[];
  diagnosticsEvents: DiagnosticsEvent[];
  hasProjects: boolean;
  isRefreshing: boolean;
  modelCatalog: PiModelCatalog | null;
  projectName: string;
  runtimeLabel: string;
  runtimeStatus: "ready" | "not-ready" | "running";
  sessionStatus: string;
  sidebarProjects: SidebarProject[];
  surface: AppFrameSurfaceKind;
  sessionSteps: SessionPanelStep[];
}

interface RuntimeSnapshotState {
  eventSnapshot: EventStreamSnapshot;
  modelCatalog: PiModelCatalog | null;
  projectSnapshot: ProjectFolderSnapshot | null;
  runtimeSnapshot: PiRuntimeSnapshot | null;
  sessionSnapshot: SessionSnapshot | null;
}

const EMPTY_EVENT_SNAPSHOT: EventStreamSnapshot = {
  appEvents: [],
  errors: [],
  rawEvents: []
};

const INITIAL_SNAPSHOT_STATE: RuntimeSnapshotState = {
  eventSnapshot: EMPTY_EVENT_SNAPSHOT,
  modelCatalog: null,
  projectSnapshot: null,
  runtimeSnapshot: null,
  sessionSnapshot: null
};

export function useRendererAppFrameState(
  api: GooeyPiApi | undefined = window.gooeyPi
): RendererAppFrameState & AppFrameActionHandlers {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshotState>(INITIAL_SNAPSHOT_STATE);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const refresh = useCallback(async () => {
    if (!api) {
      setSnapshot(INITIAL_SNAPSHOT_STATE);
      setIsRefreshing(false);
      return;
    }

    setIsRefreshing(true);

    const [
      projectSnapshot,
      runtimeSnapshot,
      sessionSnapshot,
      eventSnapshot,
      modelCatalog
    ] = await Promise.all([
      api.getProjectFolderState().catch(() => null),
      api.getPiRuntimeState().catch(() => null),
      api.getAgentSession().catch(() => null),
      api.getEventStreamSnapshot().catch(() => EMPTY_EVENT_SNAPSHOT),
      api.getPiModelCatalog().catch(() => null)
    ]);

    setSnapshot({
      eventSnapshot,
      modelCatalog,
      projectSnapshot,
      runtimeSnapshot,
      sessionSnapshot
    });
    setIsRefreshing(false);
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!api) {
      return undefined;
    }

    return api.onEventStreamMessage((message) => {
      setSnapshot((current) => applyEventStreamMessage(current, message));

      if (message.type === "session") {
        setSnapshot((current) => ({
          ...current,
          sessionSnapshot: message.session
        }));
      }
    });
  }, [api]);

  const openProject = useCallback(async () => {
    if (!api) {
      return;
    }

    setIsRefreshing(true);
    const result = await api.selectProjectFolder().catch(() => null);

    if (result?.state.valid && result.state.path) {
      await api.createAgentSession(result.state.path).catch(() => null);
    }

    await refresh();
  }, [api, refresh]);

  const retryRuntime = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const reconnect = useCallback(async () => {
    setIsReconnecting(true);
    await refresh();
    setIsReconnecting(false);
  }, [refresh]);

  const clearDiagnostics = useCallback(async () => {
    if (!api) {
      return;
    }

    const eventSnapshot = await api.clearEventStream("diagnostics").catch(() => null);

    if (eventSnapshot) {
      setSnapshot((current) => ({ ...current, eventSnapshot }));
    }
  }, [api]);

  const copySessionInfo = useCallback(async () => {
    const session = snapshot.sessionSnapshot;
    const project = snapshot.projectSnapshot?.state.path ?? "No project";
    const text = [
      `Project: ${project}`,
      `Session: ${session?.id ?? "none"}`,
      `Status: ${session?.status ?? "idle"}`
    ].join("\n");

    await navigator.clipboard?.writeText(text).catch(() => undefined);
  }, [snapshot.projectSnapshot, snapshot.sessionSnapshot]);

  const normalizedState = useMemo(
    () => buildRendererAppFrameState(snapshot, isRefreshing, isReconnecting),
    [isRefreshing, isReconnecting, snapshot]
  );

  return {
    ...normalizedState,
    onClearDiagnostics: clearDiagnostics,
    onCopySessionInfo: copySessionInfo,
    onOpenDiagnostics: clearDiagnostics,
    onOpenProject: openProject,
    onOpenSettings: undefined,
    onReconnect: reconnect,
    onRetryRuntime: retryRuntime
  };
}

export function buildRendererAppFrameState(
  snapshot: RuntimeSnapshotState,
  isRefreshing = false,
  isReconnecting = false
): RendererAppFrameState {
  const projectState = snapshot.projectSnapshot?.state;
  const projectPath = projectState?.path ?? snapshot.sessionSnapshot?.projectPath ?? null;
  const hasProjects = Boolean(projectPath);
  const projectName = projectPath ? getPathName(projectPath) : "No project selected";
  const sessionStatus = formatSessionStatus(snapshot.sessionSnapshot?.status ?? "idle");
  const runtimeStatus = mapRuntimeStatus(snapshot.runtimeSnapshot, snapshot.sessionSnapshot);
  const runtimeLabel = formatRuntimeLabel(runtimeStatus, snapshot.runtimeSnapshot, snapshot.sessionSnapshot);
  const surface = getSurfaceKind({
    eventSnapshot: snapshot.eventSnapshot,
    isReconnecting,
    isRefreshing,
    projectSnapshot: snapshot.projectSnapshot,
    runtimeSnapshot: snapshot.runtimeSnapshot,
    sessionSnapshot: snapshot.sessionSnapshot
  });
  const sidebarProjects = hasProjects
    ? [createSidebarProject(projectName, snapshot.eventSnapshot)]
    : [];

  return {
    chatItems: createChatItems(snapshot.eventSnapshot),
    diagnosticsEvents: createDiagnosticsEvents(snapshot.eventSnapshot, snapshot.runtimeSnapshot),
    hasProjects,
    isRefreshing,
    modelCatalog: snapshot.modelCatalog,
    projectName,
    runtimeLabel,
    runtimeStatus,
    sessionStatus,
    sidebarProjects,
    surface,
    sessionSteps: createSessionSteps(snapshot.sessionSnapshot, snapshot.runtimeSnapshot)
  };
}

export const RUNTIME_CHAT_METRICS: ChatSessionMetrics = {
  ...CHAT_BODY_DEFAULT_METRICS,
  cost: 0,
  contextPercent: 0,
  isUnavailable: true
};

function applyEventStreamMessage(
  current: RuntimeSnapshotState,
  message: EventStreamMessage
): RuntimeSnapshotState {
  if (message.type === "cleared") {
    return {
      ...current,
      eventSnapshot: message.snapshot
    };
  }

  if (message.type === "app") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        appEvents: [...current.eventSnapshot.appEvents, message.appEvent]
      }
    };
  }

  if (message.type === "error") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        errors: [...current.eventSnapshot.errors, message.error]
      }
    };
  }

  if (message.type === "raw") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        rawEvents: [...current.eventSnapshot.rawEvents, message.rawEvent]
      }
    };
  }

  return current;
}

function getSurfaceKind({
  eventSnapshot,
  isReconnecting,
  isRefreshing,
  projectSnapshot,
  runtimeSnapshot,
  sessionSnapshot
}: Pick<
  RuntimeSnapshotState,
  "eventSnapshot" | "projectSnapshot" | "runtimeSnapshot" | "sessionSnapshot"
> & {
  isReconnecting: boolean;
  isRefreshing: boolean;
}): AppFrameSurfaceKind {
  if (isReconnecting) {
    return "reconnecting";
  }

  if (isRefreshing || projectSnapshot?.state.checking) {
    return "loading";
  }

  if (!runtimeSnapshot) {
    return "disconnected";
  }

  if (runtimeSnapshot.status === "starting") {
    return "runtime-starting";
  }

  if (runtimeSnapshot.status === "errored") {
    return "error";
  }

  if (runtimeSnapshot.status === "unchecked") {
    return "unavailable";
  }

  if (projectSnapshot?.state.path && !projectSnapshot.state.valid) {
    return "project-invalid";
  }

  if (!projectSnapshot?.state.path) {
    return "empty";
  }

  if (sessionSnapshot?.status === "idle" || sessionSnapshot?.status === "ready") {
    return projectSnapshot.state.restored ? "project-restored" : "runtime-ready-no-project";
  }

  if (sessionSnapshot?.status === "running") {
    return "active";
  }

  if (sessionSnapshot?.status === "errored" || eventSnapshot.errors.length > 0) {
    return "error";
  }

  return "session-creating";
}

function mapRuntimeStatus(
  runtimeSnapshot: PiRuntimeSnapshot | null,
  sessionSnapshot: SessionSnapshot | null
): RendererAppFrameState["runtimeStatus"] {
  if (sessionSnapshot?.status === "running") {
    return "running";
  }

  return runtimeSnapshot?.status === "ready" ? "ready" : "not-ready";
}

function formatRuntimeLabel(
  runtimeStatus: RendererAppFrameState["runtimeStatus"],
  runtimeSnapshot: PiRuntimeSnapshot | null,
  sessionSnapshot: SessionSnapshot | null
): string {
  if (runtimeStatus === "running") {
    return "Session running";
  }

  if (runtimeSnapshot?.status === "starting") {
    return "Runtime starting";
  }

  if (runtimeSnapshot?.status === "errored" || sessionSnapshot?.status === "errored") {
    return "Runtime error";
  }

  if (!runtimeSnapshot) {
    return "Disconnected";
  }

  return runtimeStatus === "ready" ? "Renderer ready" : "Setup needed";
}

function formatSessionStatus(status: SessionSnapshot["status"]): string {
  const labels: Record<SessionSnapshot["status"], string> = {
    aborting: "Stopping session",
    disposed: "Session disposed",
    errored: "Session error",
    idle: "Idle",
    ready: "Session ready",
    running: "Session active",
    stopped: "Session stopped"
  };

  return labels[status];
}

function createSessionSteps(
  sessionSnapshot: SessionSnapshot | null,
  runtimeSnapshot: PiRuntimeSnapshot | null
): SessionPanelStep[] {
  return [
    {
      label: "Project context loaded",
      status: sessionSnapshot?.projectPath ? "complete" : "pending"
    },
    {
      label: runtimeSnapshot?.status === "ready" ? "Pi runtime ready" : "Checking Pi runtime",
      status: runtimeSnapshot?.status === "ready" ? "complete" : "current"
    },
    {
      label: sessionSnapshot?.status === "running" ? "Session running" : "Session waiting",
      status: sessionSnapshot?.status === "running" ? "current" : "pending"
    }
  ];
}

function createDiagnosticsEvents(
  eventSnapshot: EventStreamSnapshot,
  runtimeSnapshot: PiRuntimeSnapshot | null
): DiagnosticsEvent[] {
  const diagnostics = eventSnapshot.appEvents
    .filter((event) => event.kind === "diagnostic.result")
    .slice(-4)
    .map((event) => ({
      description: event.diagnostic.message,
      severity: event.diagnostic.status === "pass" ? "normal" : event.diagnostic.status === "warn" ? "warning" : "error",
      timeLabel: formatEventTime(event.timestamp),
      title: event.diagnostic.name
    }) satisfies DiagnosticsEvent);

  const errors = eventSnapshot.errors.slice(-4).map((error) => ({
    description: error.message,
    severity: "error" as const,
    timeLabel: formatEventTime(error.createdAt),
    title: error.code
  }));

  if (diagnostics.length > 0 || errors.length > 0) {
    return [...diagnostics, ...errors].slice(-4);
  }

  return [
    {
      description:
        runtimeSnapshot?.status === "ready"
          ? "Pi runtime and renderer bridge are available."
          : "Waiting for Pi runtime details from the preload bridge.",
      severity: runtimeSnapshot?.status === "ready" ? "normal" : "warning",
      timeLabel: "now",
      title: runtimeSnapshot?.status === "ready" ? "Runtime ready" : "Runtime pending"
    }
  ];
}

function createSidebarProject(
  projectName: string,
  eventSnapshot: EventStreamSnapshot
): SidebarProject {
  const messageEvents = eventSnapshot.appEvents
    .filter((event) => event.kind === "message.user")
    .slice(-6)
    .reverse();
  const chats =
    messageEvents.length > 0
      ? messageEvents.map((event, index) => ({
          name: event.content.trim() || `Session message ${index + 1}`,
          updatedSecondsAgo: secondsAgo(event.timestamp)
        }))
      : [
          { name: "Current session", unread: true, updatedSecondsAgo: 30 },
          { name: "Runtime diagnostics", updatedSecondsAgo: 5 * 60 }
        ];

  return {
    chats,
    name: projectName
  };
}

function createChatItems(eventSnapshot: EventStreamSnapshot): ChatItem[] {
  const assistantDeltas = new Map<string, string>();
  const items: ChatItem[] = [];

  for (const event of eventSnapshot.appEvents) {
    if (event.kind === "message.user") {
      items.push({
        content: event.content,
        id: event.id,
        kind: "user-message",
        timestampLabel: formatClockTime(event.timestamp)
      });
    }

    if (event.kind === "message.assistant.delta") {
      assistantDeltas.set(
        event.messageId,
        `${assistantDeltas.get(event.messageId) ?? ""}${event.delta}`
      );
    }

    if (event.kind === "message.assistant.complete") {
      items.push({
        content: assistantDeltas.get(event.messageId) || "Pi response completed.",
        costLabel: "$0.00",
        id: event.id,
        kind: "assistant-message",
        modelLabel: "Pi",
        timestampLabel: formatClockTime(event.timestamp)
      });
    }

    if (event.kind === "tool.execution.start" || event.kind === "tool.execution.end") {
      items.push(createToolItem(event));
    }

    if (event.kind === "error.created") {
      items.push({
        detail: event.error.message,
        id: event.id,
        kind: "error",
        message: event.error.message,
        title: event.error.code
      });
    }
  }

  if (items.length > 0) {
    return items;
  }

  return [
    {
      content: "Runtime state is connected. Start a session to populate the transcript.",
      id: "runtime-placeholder",
      kind: "summary",
      summaryType: "branch",
      title: "No transcript events yet"
    }
  ];
}

function createToolItem(event: Extract<AppEvent, { kind: "tool.execution.start" | "tool.execution.end" }>): ChatItem {
  return {
    commandLabel: event.kind === "tool.execution.start" ? undefined : "completed",
    detail:
      event.kind === "tool.execution.start"
        ? "Tool execution started from the Pi event stream."
        : event.isError
          ? "Tool execution ended with an error."
          : "Tool execution completed.",
    id: event.id,
    kind: "tool-action",
    status: event.kind === "tool.execution.start" ? "running" : event.isError ? "error" : "complete",
    summary: event.toolName,
    title: event.toolName,
    toolName: "read"
  };
}

function getPathName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}

function formatEventTime(timestamp: string): string {
  const seconds = secondsAgo(timestamp);

  if (seconds < 60) {
    return "now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours}h ago`;
}

function formatClockTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function secondsAgo(timestamp: string): number {
  const time = new Date(timestamp).getTime();

  if (Number.isNaN(time)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - time) / 1000));
}

export function toRuntimeSnapshot(status: PiRuntimeSnapshot["status"]): PiRuntimeSnapshot {
  return {
    checkedAt: new Date().toISOString(),
    error: null,
    errorId: null,
    packageName: "@earendil-works/pi-coding-agent",
    packageVersion: "0.74.0",
    status
  };
}

export function toProjectSnapshot(input: {
  path: string | null;
  restored?: boolean;
  valid?: boolean;
}): ProjectFolderSnapshot {
  return {
    error: null,
    state: {
      canRead: Boolean(input.path),
      canWrite: Boolean(input.path),
      checking: false,
      errorId: null,
      isGitRepository: Boolean(input.path),
      path: input.path,
      restored: input.restored ?? false,
      valid: input.valid ?? Boolean(input.path)
    }
  };
}

export function toSessionSnapshot(input: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    id: input.id ?? null,
    projectPath: input.projectPath ?? null,
    status: input.status ?? "idle"
  };
}

export function toSelectProjectFolderResult(
  snapshot: ProjectFolderSnapshot,
  canceled = false
): SelectProjectFolderResult {
  return {
    ...snapshot,
    canceled
  };
}
