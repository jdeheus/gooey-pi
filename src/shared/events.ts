import type { AppError } from "./errors";
import type {
  ChangeCheckpointSnapshot,
  ChangeDiffFile,
  ChangeRecoveryState,
  ChangeReviewFile
} from "./change-review";
import type { ProjectContextIndexResult } from "./context-index";
import type { RuntimeTaskGraphSnapshot } from "./runtime-tasks";
import type {
  BackgroundTaskSnapshot,
  NotificationReadyEvent,
  RuntimeUsageSnapshot
} from "./runtime-usage";
import type { SessionSnapshot, SessionStatus } from "./session";
import type { RuntimeTranscriptSnapshot } from "./transcript";
import type { ToolApprovalAuditEntry, ToolApprovalRequest } from "./tool-approvals";

export type AppEventKind =
  | "session.status"
  | "diagnostic.result"
  | "message.user"
  | "message.assistant.delta"
  | "message.assistant.complete"
  | "tool.execution.start"
  | "tool.execution.update"
  | "tool.execution.end"
  | "tool.approval.request"
  | "tool.approval.decision"
  | "change.summary.created"
  | "change.diff.created"
  | "change.checkpoint.restore.requested"
  | "change.recovery.created"
  | "background.task.update"
  | "notification.ready"
  | "usage.snapshot"
  | "error.created";

export interface RawPiEvent {
  id: string;
  sessionId: string | null;
  timestamp: string;
  type: string;
  payload: unknown;
}

export type DiagnosticStatus = "pass" | "warn" | "fail";

export interface DiagnosticResult {
  id: string;
  name: string;
  status: DiagnosticStatus;
  message: string;
  checkedAt: string;
  details?: unknown;
}

export type AppEvent =
  | {
      id: string;
      kind: "session.status";
      timestamp: string;
      rawEventId?: string;
      status: SessionStatus;
    }
  | {
      id: string;
      kind: "diagnostic.result";
      timestamp: string;
      diagnostic: DiagnosticResult;
    }
  | {
      id: string;
      kind: "message.user";
      timestamp: string;
      messageId: string;
      content: string;
    }
  | {
      id: string;
      kind: "message.assistant.delta";
      timestamp: string;
      rawEventId?: string;
      messageId: string;
      delta: string;
    }
  | {
      id: string;
      kind: "message.assistant.complete";
      timestamp: string;
      rawEventId?: string;
      messageId: string;
    }
  | {
      id: string;
      kind: "tool.execution.start";
      timestamp: string;
      rawEventId?: string;
      toolCallId: string;
      toolName: string;
      args: unknown;
    }
  | {
      id: string;
      kind: "tool.execution.update";
      timestamp: string;
      rawEventId?: string;
      toolCallId: string;
      toolName: string;
      partialResult: unknown;
    }
  | {
      id: string;
      kind: "tool.execution.end";
      timestamp: string;
      rawEventId?: string;
      toolCallId: string;
      toolName: string;
      result: unknown;
      isError: boolean;
    }
  | {
      id: string;
      kind: "tool.approval.request";
      timestamp: string;
      rawEventId?: string;
      request: ToolApprovalRequest;
    }
  | {
      id: string;
      kind: "tool.approval.decision";
      timestamp: string;
      rawEventId?: string;
      auditEntry: ToolApprovalAuditEntry;
    }
  | {
      branch: string | null;
      files: ChangeReviewFile[];
      id: string;
      kind: "change.summary.created";
      summary: string;
      timestamp: string;
      title?: string;
    }
  | {
      files: ChangeDiffFile[];
      id: string;
      kind: "change.diff.created";
      summary: string;
      timestamp: string;
      title?: string;
    }
  | {
      checkpoint: ChangeCheckpointSnapshot;
      files: ChangeReviewFile[];
      id: string;
      kind: "change.checkpoint.restore.requested";
      summary: string;
      timestamp: string;
      title?: string;
    }
  | {
      id: string;
      kind: "change.recovery.created";
      recovery: ChangeRecoveryState;
      timestamp: string;
    }
  | {
      id: string;
      kind: "background.task.update";
      task: BackgroundTaskSnapshot;
      timestamp: string;
    }
  | {
      id: string;
      kind: "notification.ready";
      notification: NotificationReadyEvent;
      timestamp: string;
    }
  | {
      id: string;
      kind: "usage.snapshot";
      timestamp: string;
      usage: RuntimeUsageSnapshot;
    }
  | {
      id: string;
      kind: "error.created";
      timestamp: string;
      error: AppError;
    };

export type EventStreamMessage =
  | { type: "raw"; rawEvent: RawPiEvent }
  | { type: "app"; appEvent: AppEvent }
  | { type: "context-index"; contextIndex: ProjectContextIndexResult }
  | { type: "error"; error: AppError }
  | { type: "usage"; usage: RuntimeUsageSnapshot }
  | { type: "background-task"; task: BackgroundTaskSnapshot }
  | { type: "notification-ready"; notification: NotificationReadyEvent }
  | { type: "runtime-task"; taskGraph: RuntimeTaskGraphSnapshot }
  | { type: "session"; session: SessionSnapshot }
  | { type: "transcript"; transcript: RuntimeTranscriptSnapshot }
  | { type: "cleared"; snapshot: EventStreamSnapshot };

export type EventStreamClearScope = "all" | "raw" | "app" | "diagnostics" | "errors";

export interface EventStreamSnapshot {
  rawEvents: RawPiEvent[];
  appEvents: AppEvent[];
  backgroundTasks: BackgroundTaskSnapshot[];
  contextIndex: ProjectContextIndexResult | null;
  errors: AppError[];
  notificationEvents: NotificationReadyEvent[];
  transcript: RuntimeTranscriptSnapshot;
  usage: RuntimeUsageSnapshot;
}

export function createAppEventId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(4, "0")}`;
}
