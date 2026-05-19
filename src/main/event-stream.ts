import type { WebContents } from "electron";
import type {
  ChatRunStatus,
  ChatSubagent,
  ChatSubagentActivity,
  ChatToolName,
  RuntimeTranscriptEvent
} from "@shared/chat";
import type { ProjectContextIndexResult } from "@shared/context-index";
import { createAppError, type AppError } from "@shared/errors";
import {
  createAppEventId,
  type AppEvent,
  type DiagnosticResult,
  type DiagnosticStatus,
  type EventStreamClearScope,
  type EventStreamMessage,
  type EventStreamSnapshot,
  type RawPiEvent
} from "@shared/events";
import { translateRawPiEvent } from "@shared/event-translator";
import {
  createEmptyRuntimeUsageSnapshot,
  type BackgroundTaskSnapshot,
  type NotificationReadyEvent,
  type RuntimeUsageSnapshot
} from "@shared/runtime-usage";
import type {
  RuntimeChildTask,
  RuntimeChildTaskStatus,
  RuntimeParentRun,
  RuntimeRunStatus,
  RuntimeTaskGraphSnapshot
} from "@shared/runtime-tasks";
import type { SessionSnapshot } from "@shared/session";
import { createRuntimeTranscriptSnapshot } from "@shared/transcript";
import type { RuntimeTranscriptSnapshot } from "@shared/transcript";
import { recordToolApprovalAuditEntry, registerToolApprovalRequest } from "./tool-approvals";

const MAX_EVENTS = 500;
const CHANNEL = "gooey:events:message";

type RawPiEventInput = { type?: unknown } & object;

class EventStream {
  private targets = new Set<WebContents>();
  private rawEvents: RawPiEvent[] = [];
  private appEvents: AppEvent[] = [];
  private transcriptEvents: RuntimeTranscriptEvent[] = [];
  private backgroundTasks: BackgroundTaskSnapshot[] = [];
  private contextIndex: ProjectContextIndexResult | null = null;
  private errors: AppError[] = [];
  private notificationEvents: NotificationReadyEvent[] = [];
  private usage: RuntimeUsageSnapshot = createEmptyRuntimeUsageSnapshot();
  private rawSequence = 0;
  private appSequence = 0;
  private messageSequence = 0;
  private transcriptSequence = 0;
  private transcriptCreatedAt: string | null = null;
  private transcriptSequences = new Map<string, number>();
  private assistantTranscriptContent = new Map<string, string>();
  private activeAssistantMessageId: string | null = null;
  private sessionSnapshot: SessionSnapshot | null = null;

  registerTarget(target: WebContents): void {
    this.targets.add(target);
    target.once("destroyed", () => {
      this.targets.delete(target);
    });
  }

  getSnapshot(): EventStreamSnapshot {
    return {
      rawEvents: [...this.rawEvents],
      appEvents: [...this.appEvents],
      backgroundTasks: [...this.backgroundTasks],
      contextIndex: this.contextIndex,
      transcript: this.getTranscriptSnapshot(),
      errors: [...this.errors],
      notificationEvents: [...this.notificationEvents],
      usage: this.usage
    };
  }

  clear(scope: EventStreamClearScope = "all"): EventStreamSnapshot {
    if (scope === "all" || scope === "raw") {
      this.rawEvents = [];
    }

    if (scope === "all" || scope === "app") {
      this.appEvents = [];
    }

    if (scope === "all") {
      this.transcriptEvents = [];
      this.assistantTranscriptContent.clear();
      this.transcriptSequences.clear();
      this.transcriptCreatedAt = null;
      this.contextIndex = null;
      this.backgroundTasks = [];
      this.notificationEvents = [];
      this.usage = createEmptyRuntimeUsageSnapshot();
    }

    if (scope === "diagnostics") {
      this.appEvents = this.appEvents.filter((event) => event.kind !== "diagnostic.result");
    }

    if (scope === "errors") {
      this.errors = [];
      this.appEvents = this.appEvents.filter((event) => event.kind !== "error.created");
    }

    const snapshot = this.getSnapshot();
    this.publish({ type: "cleared", snapshot });
    return snapshot;
  }

  captureRawPiEvent(sessionId: string | null, event: RawPiEventInput): void {
    const type = typeof event.type === "string" ? event.type : "unknown";
    const payload = sanitizeForRenderer(omitType(event));
    const rawEvent: RawPiEvent = {
      id: createAppEventId("raw", ++this.rawSequence),
      sessionId,
      timestamp: new Date().toISOString(),
      type,
      payload
    };

    this.rawEvents = appendBounded(this.rawEvents, rawEvent);
    this.publish({ type: "raw", rawEvent });

    this.updateMessageTracking(rawEvent);

    for (const appEvent of translateRawPiEvent(rawEvent, () => createAppEventId("app", ++this.appSequence), {
      assistantMessageId: this.activeAssistantMessageId ?? undefined,
      includeUserMessages: false
    })) {
      this.recordAppEvent(appEvent);
    }

    if (rawEvent.type === "message_end" && isAssistantMessageEvent(rawEvent)) {
      this.activeAssistantMessageId = null;
    }
  }

  recordSessionSnapshot(session: SessionSnapshot): void {
    this.sessionSnapshot = session;
    this.publish({ type: "session", session });
  }

  recordRuntimeTaskGraph(taskGraph: RuntimeTaskGraphSnapshot): void {
    for (const event of createRuntimeTaskTranscriptEvents(taskGraph)) {
      this.upsertTranscriptEvent(event);
    }

    this.publish({ type: "runtime-task", taskGraph });
    this.publishTranscriptSnapshot();
  }

  recordContextIndex(contextIndex: ProjectContextIndexResult): void {
    this.contextIndex = contextIndex;
    this.publish({ type: "context-index", contextIndex });
  }

  recordUsageSnapshot(usage: RuntimeUsageSnapshot): void {
    this.usage = usage;
    this.publish({ type: "usage", usage });
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "usage.snapshot",
      timestamp: usage.updatedAt,
      usage
    });
  }

  recordBackgroundTask(task: BackgroundTaskSnapshot): void {
    this.backgroundTasks = appendBounded(
      this.backgroundTasks.filter((existing) => existing.id !== task.id),
      task
    );
    this.publish({ type: "background-task", task });
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "background.task.update",
      task,
      timestamp: task.updatedAt
    });
  }

  recordNotificationReady(notification: NotificationReadyEvent): void {
    this.notificationEvents = appendBounded(this.notificationEvents, notification);
    this.publish({ type: "notification-ready", notification });
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "notification.ready",
      notification,
      timestamp: notification.timestamp
    });
  }

  recordToolApprovalDecision(auditEntry: Extract<AppEvent, { kind: "tool.approval.decision" }>["auditEntry"]): void {
    this.recordAppEvent({
      auditEntry,
      id: createAppEventId("app", ++this.appSequence),
      kind: "tool.approval.decision",
      timestamp: new Date().toISOString()
    });
  }

  recordSessionStatus(status: SessionSnapshot["status"]): void {
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "session.status",
      timestamp: new Date().toISOString(),
      status
    });
  }

  recordUserMessage(content: string): string {
    const messageId = createAppEventId("message", ++this.messageSequence);
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "message.user",
      timestamp: new Date().toISOString(),
      messageId,
      content
    });

    return messageId;
  }

  recordChangeSummary(input: Extract<AppEvent, { kind: "change.summary.created" }>): void {
    this.recordAppEvent(input);
  }

  recordChangeDiff(input: Extract<AppEvent, { kind: "change.diff.created" }>): void {
    this.recordAppEvent(input);
  }

  recordCheckpointRestoreRequest(
    input: Extract<AppEvent, { kind: "change.checkpoint.restore.requested" }>
  ): void {
    this.recordAppEvent(input);
  }

  recordChangeRecovery(input: Extract<AppEvent, { kind: "change.recovery.created" }>): void {
    this.recordAppEvent(input);
  }

  recordDiagnostic(input: {
    name: string;
    status: DiagnosticStatus;
    message: string;
    details?: unknown;
  }): DiagnosticResult {
    const timestamp = new Date().toISOString();
    const diagnostic: DiagnosticResult = {
      id: createAppEventId("diagnostic", ++this.appSequence),
      name: input.name,
      status: input.status,
      message: input.message,
      checkedAt: timestamp,
      ...(input.details !== undefined ? { details: sanitizeForRenderer(input.details) } : {})
    };

    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "diagnostic.result",
      timestamp,
      diagnostic
    });

    return diagnostic;
  }

  recordError(error: AppError): void {
    this.errors = appendBounded(this.errors.filter((existing) => existing.id !== error.id), error);
    this.publish({ type: "error", error });
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "error.created",
      timestamp: error.createdAt,
      error
    });
  }

  recordUnknownCaptureError(error: unknown): void {
    this.recordError(
      createAppError({
        code: "UNKNOWN",
        message: "Could not capture a Pi SDK event.",
        details: error instanceof Error ? error.message : String(error),
        recoverable: true
      })
    );
  }

  private recordAppEvent(appEvent: AppEvent): void {
    this.appEvents = appendBounded(this.appEvents, appEvent);
    this.recordTranscriptEventFromAppEvent(appEvent);
    this.publish({ type: "app", appEvent });
    this.publishTranscriptSnapshot();
  }

  private updateMessageTracking(rawEvent: RawPiEvent): void {
    if (rawEvent.type === "message_start" && isAssistantMessageEvent(rawEvent)) {
      this.activeAssistantMessageId = createAppEventId("assistant", ++this.messageSequence);
    }
  }

  private publish(message: EventStreamMessage): void {
    for (const target of [...this.targets]) {
      if (target.isDestroyed()) {
        this.targets.delete(target);
        continue;
      }

      target.send(CHANNEL, message);
    }
  }

  private publishTranscriptSnapshot(): void {
    this.publish({ type: "transcript", transcript: this.getTranscriptSnapshot() });
  }

  private getTranscriptSnapshot(): RuntimeTranscriptSnapshot {
    const now = new Date().toISOString();

    return createRuntimeTranscriptSnapshot({
      createdAt: this.transcriptCreatedAt ?? now,
      events: this.transcriptEvents,
      id: `transcript-${this.sessionSnapshot?.id ?? "current"}`,
      projectPath: this.sessionSnapshot?.projectPath ?? null,
      sessionId: this.sessionSnapshot?.id ?? null,
      updatedAt: now
    });
  }

  private recordTranscriptEventFromAppEvent(appEvent: AppEvent): void {
    switch (appEvent.kind) {
      case "message.user":
        this.upsertTranscriptEvent({
          content: appEvent.content,
          id: `transcript-user-${appEvent.messageId}`,
          kind: "user-message",
          timestamp: appEvent.timestamp
        });
        return;
      case "message.assistant.delta": {
        const content = `${this.assistantTranscriptContent.get(appEvent.messageId) ?? ""}${appEvent.delta}`;
        this.assistantTranscriptContent.set(appEvent.messageId, content);
        this.upsertTranscriptEvent({
          content,
          id: `transcript-assistant-${appEvent.messageId}`,
          kind: "assistant-message",
          modelLabel: "Pi",
          thinkingLevelLabel: "streaming",
          timestamp: appEvent.timestamp
        });
        return;
      }
      case "message.assistant.complete":
        this.upsertTranscriptEvent({
          content: this.assistantTranscriptContent.get(appEvent.messageId) || "Pi response completed.",
          id: `transcript-assistant-${appEvent.messageId}`,
          kind: "assistant-message",
          modelLabel: "Pi",
          timestamp: appEvent.timestamp
        });
        return;
      case "tool.execution.start":
        this.upsertTranscriptEvent({
          commandLabel: stringifyRendererValue(appEvent.args),
          id: `transcript-tool-${appEvent.toolCallId}`,
          kind: "tool",
          status: "running",
          summary: "Tool execution started.",
          timestamp: appEvent.timestamp,
          title: appEvent.toolName,
          toolName: mapToolName(appEvent.toolName)
        });
        return;
      case "tool.execution.update":
        this.upsertTranscriptEvent({
          detail: stringifyRendererValue(appEvent.partialResult),
          id: `transcript-tool-${appEvent.toolCallId}`,
          kind: "tool",
          status: "working",
          summary: "Tool execution updated.",
          timestamp: appEvent.timestamp,
          title: appEvent.toolName,
          toolName: mapToolName(appEvent.toolName)
        });
        return;
      case "tool.execution.end":
        this.upsertTranscriptEvent({
          detail: stringifyRendererValue(appEvent.result),
          id: `transcript-tool-${appEvent.toolCallId}`,
          kind: "tool",
          status: appEvent.isError ? "error" : "complete",
          summary: appEvent.isError ? "Tool execution failed." : "Tool execution completed.",
          timestamp: appEvent.timestamp,
          title: appEvent.toolName,
          toolName: mapToolName(appEvent.toolName)
        });
        return;
      case "tool.approval.request":
        registerToolApprovalRequest(appEvent.request);
        this.upsertTranscriptEvent({
          id: `transcript-approval-request-${appEvent.request.id}`,
          kind: "tool-approval-request",
          request: appEvent.request,
          timestamp: appEvent.timestamp
        });
        return;
      case "tool.approval.decision":
        recordToolApprovalAuditEntry(appEvent.auditEntry);
        this.upsertTranscriptEvent({
          detail: `${appEvent.auditEntry.category} · ${appEvent.auditEntry.risk}`,
          id: `transcript-approval-decision-${appEvent.auditEntry.id}`,
          kind: "tool",
          status: appEvent.auditEntry.decision === "denied" ? "error" : "complete",
          summary: `${appEvent.auditEntry.actionLabel} was ${appEvent.auditEntry.decision}.`,
          timestamp: appEvent.timestamp,
          title: "Tool approval",
          toolName: "runtime"
        });
        return;
      case "change.summary.created":
        this.upsertTranscriptEvent({
          branch: appEvent.branch,
          files: appEvent.files,
          id: `transcript-change-summary-${appEvent.id}`,
          kind: "change-summary",
          summary: appEvent.summary,
          timestamp: appEvent.timestamp,
          title: appEvent.title
        });
        return;
      case "change.diff.created":
        this.upsertTranscriptEvent({
          files: appEvent.files,
          id: `transcript-change-diff-${appEvent.id}`,
          kind: "change-review-diff",
          summary: appEvent.summary,
          timestamp: appEvent.timestamp,
          title: appEvent.title
        });
        return;
      case "change.checkpoint.restore.requested":
        this.upsertTranscriptEvent({
          checkpoint: appEvent.checkpoint,
          files: appEvent.files,
          id: `transcript-checkpoint-undo-${appEvent.id}`,
          kind: "checkpoint-undo-confirmation",
          summary: appEvent.summary,
          timestamp: appEvent.timestamp,
          title: appEvent.title
        });
        return;
      case "change.recovery.created":
        this.upsertTranscriptEvent({
          id: `transcript-change-recovery-${appEvent.id}`,
          kind: "change-recovery",
          recovery: appEvent.recovery,
          timestamp: appEvent.timestamp
        });
        return;
      case "error.created":
        this.upsertTranscriptEvent({
          detail: stringifyRendererValue(appEvent.error.details),
          id: `transcript-error-${appEvent.error.id}`,
          kind: "error",
          message: appEvent.error.message,
          timestamp: appEvent.timestamp,
          title: appEvent.error.code
        });
        return;
      case "session.status":
        if (appEvent.status === "errored" || appEvent.status === "stopped" || appEvent.status === "aborting") {
          this.upsertTranscriptEvent({
            id: `transcript-recovery-${appEvent.id}`,
            kind: "recovery",
            state: appEvent.status === "errored" ? "failed" : appEvent.status === "aborting" ? "aborted" : "stopped",
            timestamp: appEvent.timestamp
          });
        }
        return;
      case "diagnostic.result":
      case "usage.snapshot":
      case "notification.ready":
        return;
      case "background.task.update":
        this.upsertTranscriptEvent({
          detail: appEvent.task.detail,
          id: `transcript-background-task-${appEvent.task.id}`,
          kind: "background-task",
          projectLabel: appEvent.task.projectLabel,
          status: appEvent.task.status,
          summary: appEvent.task.summary,
          timestamp: appEvent.timestamp,
          title: appEvent.task.title
        });
        return;
    }
  }

  private upsertTranscriptEvent(event: RuntimeTranscriptEvent): void {
    const sequence = event.sequence ?? this.getTranscriptSequence(event.id);
    const transcriptEvent = { ...event, sequence };

    if (!this.transcriptCreatedAt) {
      this.transcriptCreatedAt = event.timestamp ?? new Date().toISOString();
    }

    const existingIndex = this.transcriptEvents.findIndex((item) => item.id === event.id);

    if (existingIndex >= 0) {
      this.transcriptEvents = this.transcriptEvents.map((item, index) =>
        index === existingIndex ? transcriptEvent : item
      );
      return;
    }

    this.transcriptEvents = appendBounded(this.transcriptEvents, transcriptEvent);
  }

  private getTranscriptSequence(id: string): number {
    const existingSequence = this.transcriptSequences.get(id);

    if (existingSequence !== undefined) {
      return existingSequence;
    }

    const sequence = ++this.transcriptSequence;
    this.transcriptSequences.set(id, sequence);
    return sequence;
  }
}

function createRuntimeTaskTranscriptEvents(
  taskGraph: RuntimeTaskGraphSnapshot
): RuntimeTranscriptEvent[] {
  const childTasksByRun = new Map<string, RuntimeChildTask[]>();

  for (const task of taskGraph.childTasks) {
    const tasks = childTasksByRun.get(task.parentRunId) ?? [];
    tasks.push(task);
    childTasksByRun.set(task.parentRunId, tasks);
  }

  return taskGraph.runs.flatMap((run) => {
    const childTasks = childTasksByRun.get(run.id) ?? [];
    const events: RuntimeTranscriptEvent[] = [
      {
        agents: childTasks.map(createRuntimeTaskAgent),
        defaultOpen: run.status === "running" || run.status === "failed",
        id: `transcript-runtime-task-chain-${run.id}`,
        kind: "subagent-chain",
        status: mapRuntimeRunStatus(run.status),
        summary: createRuntimeRunSummary(run, childTasks),
        timestamp: run.startedAt ?? run.createdAt,
        title: `runtime task chain (${Math.max(childTasks.length, 1)})`
      }
    ];

    if (run.mergeSummary?.summary && run.mergeSummary.status === "complete") {
      events.push({
        content: run.mergeSummary.summary,
        id: `transcript-runtime-merge-summary-${run.mergeSummary.id}`,
        kind: "summary",
        summaryType: "branch",
        timestamp: run.mergeSummary.completedAt ?? run.mergeSummary.createdAt,
        title: "Merge summary"
      });
    }

    if (run.failure) {
      events.push({
        detail: stringifyRendererValue(run.failure.details),
        id: `transcript-runtime-task-error-${run.id}`,
        kind: "error",
        message: run.failure.message,
        timestamp: run.completedAt ?? run.createdAt,
        title: "Runtime task failed"
      });
    }

    return events;
  });
}

function createRuntimeTaskAgent(task: RuntimeChildTask): ChatSubagent {
  return {
    activity: task.lifecycle.map((event): ChatSubagentActivity => ({
      description: event.failure?.message ?? event.summary,
      id: event.id,
      status: mapRuntimeChildTaskStatus(event.status),
      timeLabel: event.timestamp,
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

function createRuntimeRunSummary(run: RuntimeParentRun, childTasks: RuntimeChildTask[]): string {
  const childSummary =
    childTasks.length === 0
      ? "No child tasks have reported progress yet."
      : `${childTasks.length} child task${childTasks.length === 1 ? "" : "s"} tracked.`;

  return `${childSummary} Subagent policy: ${run.metadata.policy.subagentPolicy}.`;
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

function mapRuntimeRunStatus(status: RuntimeRunStatus): ChatRunStatus {
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

function mapRuntimeChildTaskStatus(status: RuntimeChildTaskStatus | RuntimeRunStatus): ChatRunStatus {
  switch (status) {
    case "blocked":
    case "failed":
      return "error";
    case "canceled":
      return "cancelled";
    case "merged":
    case "succeeded":
      return "complete";
    case "merging":
      return "working";
    case "queued":
      return "queued";
    case "running":
      return "running";
  }
}

function formatRuntimeLifecycleStage(stage: string): string {
  return stage
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function mapToolName(toolName: string): ChatToolName {
  switch (toolName) {
    case "bash":
    case "edit":
    case "find":
    case "grep":
    case "ls":
    case "read":
    case "runtime":
    case "write":
      return toolName;
    default:
      return "runtime";
  }
}

function stringifyRendererValue(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isAssistantMessageEvent(rawEvent: RawPiEvent): boolean {
  const payload = rawEvent.payload && typeof rawEvent.payload === "object" ? (rawEvent.payload as Record<string, unknown>) : null;
  const message = payload?.message && typeof payload.message === "object" ? (payload.message as Record<string, unknown>) : null;

  return message?.role === "assistant";
}

function appendBounded<T>(items: T[], item: T): T[] {
  return [...items, item].slice(-MAX_EVENTS);
}

function omitType(event: RawPiEventInput): Record<string, unknown> {
  const { type: _type, ...payload } = event as Record<string, unknown>;
  return payload;
}

function sanitizeForRenderer(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, item) => {
        if (typeof item === "bigint") {
          return item.toString();
        }

        if (item instanceof Error) {
          return {
            name: item.name,
            message: item.message,
            stack: item.stack
          };
        }

        if (typeof item === "function" || typeof item === "symbol") {
          return undefined;
        }

        return item;
      })
    );
  } catch (error) {
    return {
      serializationError: error instanceof Error ? error.message : String(error),
      value: String(value)
    };
  }
}

export const eventStream = new EventStream();
