import { useCallback, useEffect, useMemo, useState } from "react";
import type { GooeyPiApi } from "@shared/app-api";
import type { AppEvent, EventStreamMessage, EventStreamSnapshot } from "@shared/events";
import type {
  AgentSessionSubmitRequest,
  PiModelCatalog,
  PiModelThinkingLevel,
  PiRuntimeSnapshot
} from "@shared/pi";
import type {
  ProjectFolderSnapshot,
  ProjectRegistryEntry,
  SelectProjectFolderResult
} from "@shared/project";
import type {
  ChatRegistryChat,
  ChatRegistryRestoreResult,
  ChatRegistrySnapshot
} from "@shared/chat-registry";
import type {
  RuntimeChildTask,
  RuntimeChildTaskStatus,
  RuntimeParentRun,
  RuntimeTaskGraphSnapshot
} from "@shared/runtime-tasks";
import type { SessionSnapshot } from "@shared/session";
import type {
  ChatItem,
  ChatMentionOption,
  ChatRunStatus,
  ChatSessionMetrics,
  ChatSubagent,
  ChatSubagentActivity
} from "@shared/chat";
import {
  DEFAULT_RUNTIME_SETTINGS,
  type RuntimeSettingsSnapshot
} from "@shared/runtime-settings";
import {
  createEmptyRuntimeUsageSnapshot,
  type BackgroundTaskSnapshot
} from "@shared/runtime-usage";
import {
  createRuntimeTranscriptSnapshot,
  replayRuntimeTranscriptSnapshot
} from "@shared/transcript";
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
  chatMetrics: ChatSessionMetrics;
  diagnosticsEvents: DiagnosticsEvent[];
  hasProjects: boolean;
  isRefreshing: boolean;
  modelCatalog: PiModelCatalog | null;
  projectName: string;
  activeChatId: string | null;
  activeChatName: string | null;
  activeChatRecoveryNotice: string | null;
  runtimeLabel: string;
  runtimeStatus: "ready" | "not-ready" | "running";
  chatRunStatus: ChatComposerRunStatus;
  chatMentions: ChatMentionOption[];
  sessionStatus: string;
  sidebarProjects: SidebarProject[];
  surface: AppFrameSurfaceKind;
  sessionSteps: SessionPanelStep[];
}

interface RuntimeSnapshotState {
  eventSnapshot: EventStreamSnapshot;
  activeChatRestore: ChatRegistryRestoreResult | null;
  chatRegistrySnapshot: ChatRegistrySnapshot;
  modelCatalog: PiModelCatalog | null;
  projectSnapshot: ProjectFolderSnapshot | null;
  runtimeSnapshot: PiRuntimeSnapshot | null;
  runtimeSettings: RuntimeSettingsSnapshot;
  runtimeTaskGraph: RuntimeTaskGraphSnapshot;
  sessionSnapshot: SessionSnapshot | null;
}

const EMPTY_EVENT_SNAPSHOT: EventStreamSnapshot = {
  appEvents: [],
  backgroundTasks: [],
  contextIndex: null,
  transcript: createRuntimeTranscriptSnapshot({
    events: [],
    id: "transcript-empty",
    projectPath: null,
    sessionId: null
  }),
  errors: [],
  notificationEvents: [],
  usage: createEmptyRuntimeUsageSnapshot(),
  rawEvents: []
};

const EMPTY_RUNTIME_TASK_GRAPH: RuntimeTaskGraphSnapshot = {
  activeRunId: null,
  childTasks: [],
  runs: [],
  updatedAt: null
};

const EMPTY_CHAT_REGISTRY_SNAPSHOT: ChatRegistrySnapshot = {
  projects: [],
  updatedAt: null
};

const INITIAL_SNAPSHOT_STATE: RuntimeSnapshotState = {
  activeChatRestore: null,
  chatRegistrySnapshot: EMPTY_CHAT_REGISTRY_SNAPSHOT,
  eventSnapshot: EMPTY_EVENT_SNAPSHOT,
  modelCatalog: null,
  projectSnapshot: null,
  runtimeSnapshot: null,
  runtimeSettings: DEFAULT_RUNTIME_SETTINGS,
  runtimeTaskGraph: EMPTY_RUNTIME_TASK_GRAPH,
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
      runtimeTaskGraph,
      runtimeSettings,
      chatRegistrySnapshot
    ] = await Promise.all([
      api.getProjectFolderState().catch(() => null),
      api.getPiRuntimeState().catch(() => null),
      api.getAgentSession().catch(() => null),
      api.getEventStreamSnapshot().catch(() => EMPTY_EVENT_SNAPSHOT),
      api.getPiModelCatalog().catch(() => null),
      api.getRuntimeTaskGraph().catch(() => EMPTY_RUNTIME_TASK_GRAPH),
      api.getRuntimeSettings().catch(() => DEFAULT_RUNTIME_SETTINGS),
      api.getChatRegistry().catch(() => EMPTY_CHAT_REGISTRY_SNAPSHOT)
    ]);
    const projectPath = projectSnapshot?.state.valid ? projectSnapshot.state.path : null;
    const activeChatRestore = projectPath
      ? await api.restoreActiveChat(projectPath).catch(() => null)
      : null;

    setSnapshot({
      activeChatRestore,
      chatRegistrySnapshot: activeChatRestore?.snapshot ?? chatRegistrySnapshot,
      eventSnapshot,
      modelCatalog,
      projectSnapshot,
      runtimeSnapshot,
      runtimeSettings,
      runtimeTaskGraph,
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
      await api.restoreActiveChat(result.state.path).catch(() => null);
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

  const selectActiveChat = useCallback(
    async (chatId: string, chat: { projectPath?: string }) => {
      if (!api) {
        return;
      }

      const projectPath = chat.projectPath ?? getActiveProjectPath(snapshot);

      if (!projectPath) {
        return;
      }

      const currentProjectPath = getActiveProjectPath(snapshot);
      const projectSnapshotUpdate =
        currentProjectPath === projectPath
          ? null
          : await api.selectProjectPath(projectPath).catch(() => null);
      const sessionSnapshotUpdate =
        currentProjectPath === projectPath
          ? null
          : await api.createAgentSession(projectPath).catch(() => null);
      const result = await api.selectChatRegistryChat({ chatId, projectPath }).catch(() => null);

      if (result?.snapshot) {
        setSnapshot((current) => ({
          ...current,
          activeChatRestore: {
            activeChatId: result.chat?.id ?? null,
            chat: result.chat,
            error: result.error,
            fallbackReason: result.chat ? null : "missing-selected-chat",
            projectPath,
            recoveryNotice: result.chat ? null : "The selected chat is no longer available.",
            snapshot: result.snapshot,
            transcript: null
          },
          chatRegistrySnapshot: result.snapshot,
          projectSnapshot: projectSnapshotUpdate ?? current.projectSnapshot,
          sessionSnapshot: sessionSnapshotUpdate?.session ?? current.sessionSnapshot
        }));
      }
    },
    [api, snapshot]
  );

  const startNewChat = useCallback(
    async (project: SidebarProject) => {
      if (!api) {
        return;
      }

      const projectPath = project.path ?? getActiveProjectPath(snapshot);

      if (!projectPath) {
        return;
      }

      const currentProjectPath = getActiveProjectPath(snapshot);
      const projectSnapshotUpdate =
        currentProjectPath === projectPath
          ? null
          : await api.selectProjectPath(projectPath).catch(() => null);
      const result = await api.selectChatRegistryChat({ chatId: null, projectPath }).catch(() => null);

      if (result?.snapshot) {
        setSnapshot((current) => ({
          ...current,
          activeChatRestore: {
            activeChatId: null,
            chat: null,
            error: result.error,
            fallbackReason: "no-selected-chat",
            projectPath,
            recoveryNotice: null,
            snapshot: result.snapshot,
            transcript: null
          },
          chatRegistrySnapshot: result.snapshot,
          projectSnapshot: projectSnapshotUpdate ?? current.projectSnapshot
        }));
      }
    },
    [api, snapshot]
  );

  const renameChat = useCallback(
    async (_project: SidebarProject, chat: { id?: string }, name: string) => {
      if (!api || !chat.id) {
        return;
      }

      const result = await api.renameChatRegistryChat({ chatId: chat.id, title: name }).catch(() => null);

      if (result?.snapshot) {
        setSnapshot((current) => {
          const restore = current.activeChatRestore;

          if (!restore || restore.activeChatId !== chat.id) {
            return {
              ...current,
              chatRegistrySnapshot: result.snapshot
            };
          }

          return {
            ...current,
            activeChatRestore: {
              activeChatId: restore.activeChatId,
              chat: result.chat,
              error: result.error,
              fallbackReason: restore.fallbackReason,
              projectPath: restore.projectPath,
              recoveryNotice: restore.recoveryNotice,
              snapshot: result.snapshot,
              transcript: restore.transcript
            },
            chatRegistrySnapshot: result.snapshot
          };
        });
      }
    },
    [api]
  );

  const submitComposer = useCallback(
    async (payload: ChatComposerSubmitPayload): Promise<ChatComposerSubmitResult> => {
      if (!api) {
        return {
          accepted: false,
          errorMessage: "The renderer bridge is not available."
        };
      }

      const projectPath = getActiveProjectPath(snapshot);

      if (!projectPath) {
        return {
          accepted: false,
          errorMessage: "Select a project before starting a chat."
        };
      }

      let sessionSnapshot = snapshot.sessionSnapshot;

      if (!sessionSnapshot?.id || sessionSnapshot.projectPath !== projectPath) {
        const createResult = await api.createAgentSession(projectPath).catch((error) => ({
          error: {
            message: error instanceof Error ? error.message : "The session could not be created."
          },
          session: snapshot.sessionSnapshot
        }));

        if (createResult.error) {
          return {
            accepted: false,
            errorMessage: createResult.error.message
          };
        }

        sessionSnapshot = createResult.session;
      }

      if (!snapshot.activeChatRestore?.activeChatId) {
        const chatResult = await api.createChatRegistryChat({
          projectPath,
          sessionFile: sessionSnapshot?.sessionFile ?? null,
          sessionId: sessionSnapshot?.id ?? null,
          title: createChatTitle(payload)
        }).catch((error) => ({
          chat: null,
          error: {
            message: error instanceof Error ? error.message : "The chat could not be created."
          },
          snapshot: snapshot.chatRegistrySnapshot
        }));

        if (chatResult.error || !chatResult.chat) {
          return {
            accepted: false,
            errorMessage: chatResult.error?.message ?? "The chat could not be created."
          };
        }

        const createdChat = chatResult.chat;

        setSnapshot((current) => ({
          ...current,
          activeChatRestore: {
            activeChatId: createdChat.id,
            chat: createdChat,
            error: null,
            fallbackReason: null,
            projectPath,
            recoveryNotice: null,
            snapshot: chatResult.snapshot,
            transcript: null
          },
          chatRegistrySnapshot: chatResult.snapshot,
          sessionSnapshot
        }));
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
    [api, snapshot]
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
    onActiveChatChange: selectActiveChat,
    onOpenDiagnostics: clearDiagnostics,
    onOpenProject: openProject,
    onOpenSettings: undefined,
    onNewChat: startNewChat,
    onRenameChat: renameChat,
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
  const activeChat = snapshot.activeChatRestore?.chat ?? null;
  const activeChatId = snapshot.activeChatRestore?.activeChatId ?? null;
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
  const sidebarProjects = createSidebarProjects({
    chatRegistrySnapshot: snapshot.chatRegistrySnapshot,
    eventSnapshot: snapshot.eventSnapshot,
    fallbackProjectName: projectName,
    hasProjects,
    projects: snapshot.projectSnapshot?.registry.projects ?? []
  });

  return {
    activeChatId,
    activeChatName: activeChat?.title ?? null,
    activeChatRecoveryNotice: snapshot.activeChatRestore?.recoveryNotice ?? null,
    chatItems: createChatItems(snapshot),
    chatMentions: snapshot.eventSnapshot.contextIndex?.mentions ?? [],
    chatMetrics: createRuntimeChatMetrics(snapshot),
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

  if (message.type === "runtime-task") {
    return {
      ...current,
      runtimeTaskGraph: message.taskGraph
    };
  }

  if (message.type === "transcript") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        transcript: message.transcript
      }
    };
  }

  if (message.type === "context-index") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        contextIndex: message.contextIndex
      }
    };
  }

  if (message.type === "usage") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        usage: message.usage
      }
    };
  }

  if (message.type === "background-task") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        backgroundTasks: upsertBackgroundTask(current.eventSnapshot.backgroundTasks, message.task)
      }
    };
  }

  if (message.type === "notification-ready") {
    return {
      ...current,
      eventSnapshot: {
        ...current.eventSnapshot,
        notificationEvents: [...current.eventSnapshot.notificationEvents, message.notification]
      }
    };
  }

  return current;
}

function upsertBackgroundTask(
  tasks: BackgroundTaskSnapshot[],
  task: BackgroundTaskSnapshot
): BackgroundTaskSnapshot[] {
  return [...tasks.filter((existing) => existing.id !== task.id), task].slice(-12);
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

function createChatTitle(payload: ChatComposerSubmitPayload): string {
  const text = payload.text.trim();

  if (text) {
    return text.length > 56 ? `${text.slice(0, 53)}...` : text;
  }

  if (payload.selectedTokens.length > 0) {
    return `Context chat (${payload.selectedTokens.length})`;
  }

  if (payload.attachments.length > 0) {
    return `Attachment chat (${payload.attachments.length})`;
  }

  return "New chat";
}

function getActiveProjectPath(snapshot: RuntimeSnapshotState): string | null {
  return snapshot.projectSnapshot?.state.path ?? snapshot.sessionSnapshot?.projectPath ?? null;
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

  if (sessionSnapshot?.status === "running") {
    return "active";
  }

  if (sessionSnapshot?.status === "errored" || eventSnapshot.errors.length > 0) {
    return "error";
  }

  if (runtimeSnapshot.status === "ready") {
    return "active";
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
      correlations: [
        { label: "Run", value: getDiagnosticDetailValue(event.diagnostic.details, "runId") },
        { label: "Source", value: getDiagnosticDetailValue(event.diagnostic.details, "source") }
      ].filter((entry) => entry.value !== "n/a"),
      description: event.diagnostic.message,
      severity: event.diagnostic.status === "pass" ? "normal" : event.diagnostic.status === "warn" ? "warning" : "error",
      timeLabel: formatEventTime(event.timestamp),
      title: event.diagnostic.name
    }) satisfies DiagnosticsEvent);

  const errors = eventSnapshot.errors.slice(-4).map((error) => ({
    correlations: [
      { label: "Source", value: "Renderer event stream" },
      { label: "Details", value: formatDiagnosticDetails(error.details) },
      { label: "Action", value: "Copy or clear from the header" }
    ].filter((entry) => entry.value !== "n/a"),
    description: error.message,
    severity: "error" as const,
    timeLabel: formatEventTime(error.createdAt),
    title: error.code
  }));

  if (diagnostics.length > 0 || errors.length > 0) {
    return [...diagnostics, ...errors].slice(-4);
  }

  const correlatedEvents = createCorrelatedDiagnosticsEvents(eventSnapshot);

  if (correlatedEvents.length > 0) {
    return correlatedEvents;
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

function createCorrelatedDiagnosticsEvents(eventSnapshot: EventStreamSnapshot): DiagnosticsEvent[] {
  return eventSnapshot.appEvents
    .filter((event) =>
      event.kind === "background.task.update" ||
      event.kind === "change.summary.created" ||
      event.kind === "tool.execution.end" ||
      event.kind === "tool.execution.start" ||
      event.kind === "tool.execution.update" ||
      event.kind === "notification.ready"
    )
    .slice(-4)
    .map((event) => {
      if (event.kind === "background.task.update") {
        return {
          correlations: [
            { label: "Run", value: event.task.relatedRunId ?? "n/a" },
            { label: "Chat", value: event.task.relatedChatId ?? "n/a" },
            { label: "Project", value: event.task.projectLabel ?? "n/a" }
          ].filter((entry) => entry.value !== "n/a"),
          description: event.task.summary,
          severity: event.task.status === "needs-attention" ? "warning" : "normal",
          timeLabel: formatEventTime(event.timestamp),
          title: event.task.title
        } satisfies DiagnosticsEvent;
      }

      if (event.kind === "notification.ready") {
        return {
          correlations: [
            { label: "Task", value: event.notification.backgroundTaskId ?? "n/a" },
            { label: "Project", value: event.notification.projectLabel ?? "n/a" }
          ].filter((entry) => entry.value !== "n/a"),
          description: event.notification.summary,
          severity: event.notification.severity === "error"
            ? "error"
            : event.notification.severity === "warning"
              ? "warning"
              : "normal",
          timeLabel: formatEventTime(event.timestamp),
          title: event.notification.title
        } satisfies DiagnosticsEvent;
      }

      if (event.kind === "change.summary.created") {
        return {
          correlations: [
            { label: "Branch", value: event.branch ?? "n/a" },
            { label: "Files", value: `${event.files.length}` }
          ].filter((entry) => entry.value !== "n/a"),
          description: event.summary,
          severity: event.files.some((file) => file.impact === "high") ? "warning" : "normal",
          timeLabel: formatEventTime(event.timestamp),
          title: event.title ?? "Change summary"
        } satisfies DiagnosticsEvent;
      }

      return {
        correlations: [
          { label: "Tool", value: event.toolName },
          { label: "Call", value: event.toolCallId }
        ],
        description:
          event.kind === "tool.execution.end"
            ? event.isError
              ? "Tool execution ended with an error."
              : "Tool execution completed."
            : event.kind === "tool.execution.update"
              ? "Tool execution reported progress."
              : "Tool execution started.",
        severity: event.kind === "tool.execution.end" && event.isError ? "error" : "normal",
        timeLabel: formatEventTime(event.timestamp),
        title: event.toolName
      } satisfies DiagnosticsEvent;
    });
}

function getDiagnosticDetailValue(details: unknown, key: string): string {
  if (!details || typeof details !== "object" || !(key in details)) {
    return "n/a";
  }

  const value = (details as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim() ? value : "n/a";
}

function formatDiagnosticDetails(details: unknown): string {
  if (details === undefined || details === null) {
    return "n/a";
  }

  if (typeof details === "string") {
    return details.trim() || "n/a";
  }

  if (typeof details === "object" && "message" in details) {
    const message = (details as Record<string, unknown>).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

function createRuntimeChatMetrics(snapshot: RuntimeSnapshotState): ChatSessionMetrics {
  const usage = snapshot.eventSnapshot.usage;
  const hasRuntimeUsage =
    usage.cost > 0 ||
    usage.tokens > 0 ||
    usage.contextPercent > 0 ||
    usage.compactions.length > 0 ||
    usage.billingSources.length > 0;

  if (!hasRuntimeUsage) {
    return {
      ...RUNTIME_CHAT_METRICS,
      isUnavailable: mapRuntimeStatus(snapshot.runtimeSnapshot, snapshot.sessionSnapshot) !== "ready"
    };
  }

  return {
    billingSources: usage.billingSources,
    compactions: usage.compactions,
    contextPercent: usage.contextPercent,
    cost: usage.cost,
    isCompacting: Boolean(usage.isCompacting) || usage.contextStatus === "compacting",
    isUnavailable: mapRuntimeStatus(snapshot.runtimeSnapshot, snapshot.sessionSnapshot) === "not-ready",
    tokens: usage.tokens
  };
}

function createSidebarProjects(input: {
  chatRegistrySnapshot: ChatRegistrySnapshot;
  eventSnapshot: EventStreamSnapshot;
  fallbackProjectName: string;
  hasProjects: boolean;
  projects: ProjectRegistryEntry[];
}): SidebarProject[] {
  if (!input.hasProjects) {
    return [];
  }

  const registryProjects = input.chatRegistrySnapshot.projects.map((project) => ({
      chats: project.chats.map((chat) => ({
        id: chat.id,
        isHidden: Boolean(chat.hiddenAt),
        name: chat.title,
        projectPath: chat.projectPath,
        updatedSecondsAgo: secondsAgo(chat.updatedAt)
      })),
      name: project.name,
      path: project.path
    }));

  const readableProjects = input.projects.filter((project) => project.recovery.status === "available");

  if (registryProjects.length > 0) {
    const registryProjectPaths = new Set(registryProjects.map((project) => project.path));
    const missingReadableProjects = readableProjects
      .filter((project) => !registryProjectPaths.has(project.path))
      .map((project) => ({
        chats: [],
        name: project.name,
        path: project.path
      }));

    return [...registryProjects, ...missingReadableProjects];
  }

  if (readableProjects.length === 0) {
    return [createSidebarProject(input.fallbackProjectName, input.eventSnapshot)];
  }

  return readableProjects.map((project, index) =>
    createSidebarProject(project.name, index === 0 ? input.eventSnapshot : EMPTY_EVENT_SNAPSHOT, project.path)
  );
}

function createSidebarProject(
  projectName: string,
  eventSnapshot: EventStreamSnapshot,
  projectPath?: string
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
    name: projectName,
    path: projectPath
  };
}

function createChatItems(snapshot: RuntimeSnapshotState): ChatItem[] {
  const eventSnapshot = snapshot.eventSnapshot;
  const runtimeTaskGraph = snapshot.runtimeTaskGraph;
  const activeChatSessionId = snapshot.activeChatRestore?.chat?.sessionId ?? null;
  const transcript = snapshot.activeChatRestore?.transcript ?? eventSnapshot.transcript;
  const canUseLiveTranscript =
    !activeChatSessionId ||
    !transcript.sessionId ||
    transcript.sessionId === activeChatSessionId ||
    snapshot.sessionSnapshot?.id === activeChatSessionId;

  if (transcript.eventCount > 0 && canUseLiveTranscript) {
    return replayRuntimeTranscriptSnapshot(transcript).items;
  }

  if (activeChatSessionId && transcript.sessionId && transcript.sessionId !== activeChatSessionId) {
    return [
      {
        content:
          "This chat was restored from the registry. Runtime transcript replay will load once the matching session snapshot is available.",
        id: "chat-transcript-restore-placeholder",
        kind: "summary",
        summaryType: "branch",
        title: "Chat transcript not loaded"
      }
    ];
  }

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

  for (const item of createRuntimeTaskItems(runtimeTaskGraph)) {
    if (!items.some((existing) => existing.id === item.id)) {
      items.push(item);
    }
  }

  for (const item of createBackgroundTaskItems(eventSnapshot)) {
    if (!items.some((existing) => existing.id === item.id)) {
      items.push(item);
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

  const runtimeTaskItems = createRuntimeTaskItems(runtimeTaskGraph);

  if (runtimeTaskItems.length > 0) {
    return runtimeTaskItems;
  }

  const backgroundTaskItems = createBackgroundTaskItems(eventSnapshot);

  if (backgroundTaskItems.length > 0) {
    return backgroundTaskItems;
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

function createBackgroundTaskItems(eventSnapshot: EventStreamSnapshot): ChatItem[] {
  return eventSnapshot.backgroundTasks.slice(-4).map((task) => ({
    detail: task.detail,
    id: `background-task-${task.id}`,
    kind: "background-task",
    projectLabel: task.projectLabel,
    status: task.status,
    summary: task.summary,
    timestampLabel: formatEventTime(task.updatedAt),
    title: task.title
  }));
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

function createRuntimeTaskItems(taskGraph: RuntimeTaskGraphSnapshot): ChatItem[] {
  if (taskGraph.runs.length === 0) {
    return [];
  }

  const childTasksByRun = new Map<string, RuntimeChildTask[]>();

  for (const task of taskGraph.childTasks) {
    const tasks = childTasksByRun.get(task.parentRunId) ?? [];
    tasks.push(task);
    childTasksByRun.set(task.parentRunId, tasks);
  }

  return taskGraph.runs.flatMap((run) => createRuntimeRunItems(run, childTasksByRun.get(run.id) ?? []));
}

function createRuntimeRunItems(run: RuntimeParentRun, childTasks: RuntimeChildTask[]): ChatItem[] {
  const agents = childTasks.map((task) => createRuntimeTaskAgent(task));
  const items: ChatItem[] = [
    {
      agents,
      defaultOpen: run.status === "running" || run.status === "failed",
      id: `runtime-task-chain-${run.id}`,
      kind: "subagent-chain",
      status: mapRuntimeRunStatus(run.status),
      summary: createRuntimeRunSummary(run, childTasks),
      timestampLabel: run.startedAt ? formatClockTime(run.startedAt) : undefined,
      title: `runtime task chain (${Math.max(agents.length, 1)})`
    }
  ];

  if (run.mergeSummary?.summary && run.mergeSummary.status === "complete") {
    items.push({
      content: run.mergeSummary.summary,
      id: `runtime-merge-summary-${run.mergeSummary.id}`,
      kind: "summary",
      summaryType: "branch",
      timestampLabel: run.mergeSummary.completedAt ? formatClockTime(run.mergeSummary.completedAt) : undefined,
      title: "Merge summary"
    });
  }

  if (run.failure) {
    items.push({
      detail: run.failure.message,
      id: `runtime-task-error-${run.id}`,
      kind: "error",
      message: run.failure.message,
      title: "Runtime task failed"
    });
  }

  return items;
}

function createRuntimeTaskAgent(task: RuntimeChildTask): ChatSubagent {
  return {
    activity: task.lifecycle.map((event): ChatSubagentActivity => ({
      description: event.failure?.message ?? event.summary,
      id: event.id,
      status: mapRuntimeChildTaskStatus(task.status),
      timeLabel: formatClockTime(event.timestamp),
      title: formatRuntimeLifecycleStage(event.stage)
    })),
    id: task.id,
    model: task.model.modelId,
    name: task.kind === "subagent" ? task.label : "primary agent",
    role: task.progress.currentStep ?? task.label,
    status: mapRuntimeChildTaskStatus(task.status),
    toolsLabel: createRuntimeTaskToolsLabel(task)
  };
}

function formatRuntimeLifecycleStage(stage: string): string {
  return stage
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function createRuntimeRunSummary(run: RuntimeParentRun, childTasks: RuntimeChildTask[]): string {
  const policy = run.metadata.policy.subagentPolicy;
  const childSummary =
    childTasks.length === 0
      ? "No child tasks have reported progress yet."
      : `${childTasks.length} child task${childTasks.length === 1 ? "" : "s"} tracked.`;

  return `${childSummary} Subagent policy: ${policy}.`;
}

function createRuntimeTaskToolsLabel(task: RuntimeChildTask): string {
  if (task.failure) {
    return "failed";
  }

  if (task.status === "queued" || task.status === "blocked" || task.status === "canceled") {
    return task.status;
  }

  if (task.progress.completedSteps > 0) {
    return `${task.progress.completedSteps} events`;
  }

  return task.model.source;
}

function mapRuntimeRunStatus(status: RuntimeParentRun["status"]): ChatRunStatus {
  switch (status) {
    case "canceled":
      return "cancelled";
    case "failed":
      return "error";
    case "merging":
      return "working";
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "succeeded":
      return "complete";
  }
}

function mapRuntimeChildTaskStatus(status: RuntimeChildTaskStatus): ChatRunStatus {
  switch (status) {
    case "blocked":
    case "failed":
      return "error";
    case "canceled":
      return "cancelled";
    case "merged":
    case "succeeded":
      return "complete";
    case "queued":
      return "queued";
    case "running":
      return "running";
  }
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
  const projectId = input.path ? "project-storybook" : null;
  const timestamp = "2026-01-01T00:00:00.000Z";

  return {
    error: null,
    registry: {
      projects: input.path
        ? [
            {
              addedAt: timestamp,
              id: "project-storybook",
              lastSelectedAt: timestamp,
              name: getPathName(input.path),
              path: input.path,
              recovery: {
                canRead: Boolean(input.path),
                canWrite: Boolean(input.path),
                checkedAt: timestamp,
                errorCode: null,
                errorId: null,
                isDirectory: Boolean(input.path),
                isGitRepository: Boolean(input.path),
                message: null,
                status: input.valid === false ? "invalid" : "available"
              },
              updatedAt: timestamp
            }
          ]
        : [],
      restored: input.restored ?? false,
      selectedProjectId: projectId,
      selectedProjectPath: input.path
    },
    state: {
      canRead: Boolean(input.path),
      canWrite: Boolean(input.path),
      checking: false,
      errorId: null,
      isGitRepository: Boolean(input.path),
      path: input.path,
      projectId,
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
