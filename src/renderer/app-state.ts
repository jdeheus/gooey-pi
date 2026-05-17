import { useCallback, useEffect, useMemo, useState } from "react";
import type { GooeyPiApi } from "@shared/app-api";
import type { AppEvent, EventStreamMessage, EventStreamSnapshot } from "@shared/events";
import type {
  AgentSessionSubmitRequest,
  PiModelCatalog,
  PiModelThinkingLevel,
  PiRuntimeSnapshot
} from "@shared/pi";
import type { ProjectFolderSnapshot, SelectProjectFolderResult } from "@shared/project";
import type { SessionSnapshot } from "@shared/session";
import type { ChatItem, ChatSessionMetrics } from "@shared/chat";
import {
  DEFAULT_RUNTIME_SETTINGS,
  type RuntimeSettingsSnapshot
} from "@shared/runtime-settings";
import type {
  ChatComposerRunStatus,
  ChatComposerSubmitPayload,
  ChatComposerSubmitResult
} from "@renderer/surfaces/chat-body";
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
  chatRunStatus: ChatComposerRunStatus;
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
  runtimeSettings: RuntimeSettingsSnapshot;
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
  runtimeSettings: DEFAULT_RUNTIME_SETTINGS,
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
      modelCatalog,
      runtimeSettings
    ] = await Promise.all([
      api.getProjectFolderState().catch(() => null),
      api.getPiRuntimeState().catch(() => null),
      api.getAgentSession().catch(() => null),
      api.getEventStreamSnapshot().catch(() => EMPTY_EVENT_SNAPSHOT),
      api.getPiModelCatalog().catch(() => null),
      api.getRuntimeSettings().catch(() => DEFAULT_RUNTIME_SETTINGS)
    ]);

    setSnapshot({
      eventSnapshot,
      modelCatalog,
      projectSnapshot,
      runtimeSnapshot,
      runtimeSettings,
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

  const submitComposer = useCallback(
    async (payload: ChatComposerSubmitPayload): Promise<ChatComposerSubmitResult> => {
      if (!api) {
        return {
          accepted: false,
          errorMessage: "The renderer bridge is not available."
        };
      }

      const result = await api.submitPrompt(
        createRuntimeSubmitRequest(payload, snapshot.runtimeSettings)
      ).catch((error) => ({
        error: {
          message: error instanceof Error ? error.message : "The prompt could not be sent."
        },
        messageId: null,
        runId: null,
        session: snapshot.sessionSnapshot,
        status: "failed" as const
      }));

      if (result.session) {
        setSnapshot((current) => ({
          ...current,
          sessionSnapshot: result.session
        }));
      }

      if (result.error) {
        return {
          accepted: false,
          errorMessage: result.error.message
        };
      }

      return {
        accepted: result.status === "accepted" || result.status === "queued" || result.status === "steered"
      };
    },
    [api, snapshot.runtimeSettings, snapshot.sessionSnapshot]
  );

  const stopActiveRun = useCallback(async () => {
    if (!api) {
      return;
    }

    const result = await api.stopAgentSession().catch(() => null);

    if (result?.session) {
      setSnapshot((current) => ({
        ...current,
        sessionSnapshot: result.session
      }));
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
    onComposerSubmit: submitComposer,
    onOpenDiagnostics: clearDiagnostics,
    onOpenProject: openProject,
    onOpenSettings: undefined,
    onReconnect: reconnect,
    onRetryRuntime: retryRuntime,
    onStopActiveRun: stopActiveRun
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
    chatRunStatus: mapComposerRunStatus(snapshot.sessionSnapshot),
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

function createRuntimeSubmitRequest(
  payload: ChatComposerSubmitPayload,
  settings: RuntimeSettingsSnapshot
): AgentSessionSubmitRequest {
  const thinkingLevel = getThinkingLevelFromModel(settings.models.primaryModel);

  return {
    attachments: payload.attachments,
    intent: payload.intent ?? "send",
    model: {
      modelId: settings.models.primaryModel,
      role: "primary",
      ...(thinkingLevel ? { thinkingLevel } : {})
    },
    planMode: payload.planMode,
    selectedTokens: payload.selectedTokens,
    text: payload.text
  };
}

function getThinkingLevelFromModel(modelId: string): PiModelThinkingLevel | undefined {
  const maybeThinkingLevel = modelId.split(":").at(-1);
  const allowedThinkingLevels: PiModelThinkingLevel[] = [
    "off",
    "minimal",
    "low",
    "medium",
    "high",
    "xhigh"
  ];

  return allowedThinkingLevels.find((level) => level === maybeThinkingLevel);
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

function mapComposerRunStatus(sessionSnapshot: SessionSnapshot | null): ChatComposerRunStatus {
  switch (sessionSnapshot?.status) {
    case "running":
      return "running";
    case "aborting":
      return "stopping";
    case "errored":
      return "error";
    case "stopped":
      return "stopped";
    default:
      return "idle";
  }
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
          id: event.id,
          name: event.content.trim() || `Session message ${index + 1}`,
          updatedSecondsAgo: secondsAgo(event.timestamp)
        }))
      : [
          {
            id: "current-session",
            name: "Current session",
            unread: true,
            updatedSecondsAgo: 30
          },
          {
            id: "runtime-diagnostics",
            name: "Runtime diagnostics",
            updatedSecondsAgo: 5 * 60
          }
        ];

  return {
    chats,
    name: projectName
  };
}

function createChatItems(eventSnapshot: EventStreamSnapshot): ChatItem[] {
  const assistantDeltas = new Map<string, string>();
  const completedAssistantMessages = new Set<string>();
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
      completedAssistantMessages.add(event.messageId);
      items.push({
        content: assistantDeltas.get(event.messageId) || "Pi response completed.",
        costLabel: "$0.00",
        id: event.id,
        kind: "assistant-message",
        modelLabel: "Pi",
        timestampLabel: formatClockTime(event.timestamp)
      });
    }

    if (
      event.kind === "tool.execution.start" ||
      event.kind === "tool.execution.update" ||
      event.kind === "tool.execution.end"
    ) {
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

  for (const [messageId, content] of assistantDeltas.entries()) {
    if (!completedAssistantMessages.has(messageId) && content.trim()) {
      items.push({
        content,
        id: `assistant-streaming-${messageId}`,
        kind: "assistant-message",
        modelLabel: "Pi",
        thinkingLevelLabel: "streaming"
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

function createToolItem(
  event: Extract<
    AppEvent,
    { kind: "tool.execution.end" | "tool.execution.start" | "tool.execution.update" }
  >
): ChatItem {
  const status =
    event.kind === "tool.execution.end"
      ? event.isError
        ? "error"
        : "complete"
      : event.kind === "tool.execution.update"
        ? "working"
        : "running";

  return {
    commandLabel:
      event.kind === "tool.execution.start"
        ? undefined
        : event.kind === "tool.execution.update"
          ? "updated"
          : "completed",
    detail:
      event.kind === "tool.execution.start"
        ? "Tool execution started from the Pi event stream."
        : event.kind === "tool.execution.update"
          ? "Tool execution is streaming partial results."
          : event.isError
            ? "Tool execution ended with an error."
            : "Tool execution completed.",
    id: event.id,
    kind: "tool-action",
    status,
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
