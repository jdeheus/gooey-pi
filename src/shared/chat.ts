import type {
  ChangeCheckpointSnapshot,
  ChangeDiffFile,
  ChangeRecoveryState,
  ChangeReviewFile
} from "./change-review";
import type {
  GitAutomationFailure,
  GitChangedFile,
  VerificationCheckResult,
  VerificationPipelineStatus
} from "./github-automation";
import type {
  ToolApprovalBlockedState,
  ToolApprovalRequest
} from "./tool-approvals";
import type { BackgroundTaskStatus } from "./runtime-usage";
import type { OperatorRunSnapshot } from "./operator-run";

export type ChatAttachmentKind = "file" | "image";

export type ChatAttachmentPreviewState = "available" | "unknown" | "unsupported";

export type ChatAttachmentSource = "local-file" | "project-file" | "selected-context";

export type ChatAttachmentUploadStatus = "complete" | "error" | "uploading";

export interface ChatAttachment {
  description?: string;
  errorMessage?: string;
  id: string;
  kind: ChatAttachmentKind;
  mimeType?: string;
  name: string;
  previewState?: ChatAttachmentPreviewState;
  previewText?: string;
  previewUrl?: string;
  sizeLabel?: string;
  source?: ChatAttachmentSource;
  uploadProgress?: number;
  uploadStatus?: ChatAttachmentUploadStatus;
}

export type ChatCommandSource = "builtin" | "extension" | "prompt" | "skill";

export interface ChatCommandOption {
  description?: string;
  id: string;
  name: string;
  shortcut?: string;
  source: ChatCommandSource;
}

export type ChatMentionKind = "file" | "resource" | "skill";

export interface ChatMentionOption {
  description?: string;
  id: string;
  kind: ChatMentionKind;
  label: string;
  path?: string;
  projectRelativePath?: string;
  score?: number;
  sizeBytes?: number;
}

export type ChatRunStatus =
  | "cancelled"
  | "complete"
  | "error"
  | "queued"
  | "running"
  | "working";

export type ChatToolName =
  | "bash"
  | "edit"
  | "find"
  | "grep"
  | "ls"
  | "read"
  | "runtime"
  | "write";

export type ChatBillingSource = "api" | "subscription";

export interface ChatSessionMetrics {
  billingLabel?: string;
  billingSources?: ChatBillingSource[];
  compactions?: ChatCompactionCostEntry[];
  contextPercent: number;
  cost: number;
  isCompacting?: boolean;
  isUnavailable?: boolean;
  tokens?: number;
}

export interface ChatProviderCost {
  cost: number;
  provider: string;
  tokens?: number;
}

export interface ChatCompactionCostEntry {
  id: string;
  providerCosts: ChatProviderCost[];
  timestampLabel?: string;
  title: string;
}

export interface ChatToken {
  id: string;
  kind: "command" | "mention";
  label: string;
}

export interface ChatBaseItem {
  costLabel?: string;
  id: string;
  timestampLabel?: string;
}

export interface ChatMessageItem extends ChatBaseItem {
  attachments?: ChatAttachment[];
  content: string;
  kind: "assistant-message" | "user-message";
  modelLabel?: string;
  providerLabel?: string;
  thinkingLevelLabel?: string;
}

export interface ChatToolActionItem extends ChatBaseItem {
  commandLabel?: string;
  defaultOpen?: boolean;
  detail?: string;
  kind: "tool-action";
  path?: string;
  status: ChatRunStatus;
  summary: string;
  title: string;
  toolName: ChatToolName;
  truncated?: boolean;
}

export interface ChatThinkingItem extends ChatBaseItem {
  defaultOpen?: boolean;
  detail: string;
  kind: "thinking";
  status: ChatRunStatus;
  summary: string;
  title: string;
}

export interface ChatCompactionNoticeItem extends ChatBaseItem {
  detail?: string;
  kind: "compaction-notice";
  status: Extract<ChatRunStatus, "complete" | "error" | "running">;
  summary: string;
  title: string;
}

export interface ChatCustomSurfaceItem extends ChatBaseItem {
  customType: string;
  description: string;
  detailLines?: string[];
  kind: "custom-surface";
  status?: ChatRunStatus;
  title: string;
}

export interface ChatSubagent {
  activity?: ChatSubagentActivity[];
  durationLabel?: string;
  id: string;
  model?: string;
  name: string;
  role: string;
  status: ChatRunStatus;
  toolsLabel?: string;
}

export interface ChatSubagentActivity {
  description?: string;
  id: string;
  status: ChatRunStatus;
  timeLabel?: string;
  title: string;
}

export interface ChatSubagentChainAction {
  id: string;
  label: string;
}

export interface ChatSubagentChainItem extends ChatBaseItem {
  action?: ChatSubagentChainAction;
  agents: ChatSubagent[];
  defaultOpen?: boolean;
  kind: "subagent-chain";
  status: ChatRunStatus;
  summary?: string;
  title: string;
}

export type ChatRecoveryState = "aborted" | "failed" | "resumed" | "stopped";

export interface ChatRecoveryAction {
  id: string;
  label: string;
}

export interface ChatRecoveryItem extends ChatBaseItem {
  actions?: ChatRecoveryAction[];
  detail?: string;
  kind: "recovery";
  message: string;
  state: ChatRecoveryState;
  title: string;
}

export interface ChatSummaryItem extends ChatBaseItem {
  content: string;
  kind: "summary";
  summaryType: "branch" | "compaction";
  title: string;
}

export interface ChatErrorItem extends ChatBaseItem {
  detail?: string;
  kind: "error";
  message: string;
  title: string;
}

export interface ChatVerificationSummaryItem extends ChatBaseItem {
  checks: VerificationCheckResult[];
  kind: "verification-summary";
  status: VerificationPipelineStatus;
  summary: string;
  title: string;
}

export interface ChatGitHubAutomationReadyItem extends ChatBaseItem {
  autoPushEnabled?: boolean;
  branch: string;
  checkStatus: VerificationPipelineStatus;
  files: GitChangedFile[];
  kind: "github-automation-ready";
  nextAction: "commit" | "open-pr" | "push";
  summary: string;
  title: string;
}

export interface ChatGitHubAutomationErrorItem extends ChatBaseItem {
  failure: GitAutomationFailure;
  kind: "github-automation-error";
}

export interface ChatToolApprovalRequestItem extends ChatBaseItem {
  kind: "tool-approval-request";
  request: ToolApprovalRequest;
}

export interface ChatToolApprovalBlockedItem extends ChatBaseItem {
  blocked: ToolApprovalBlockedState;
  kind: "tool-approval-blocked";
}

export interface ChatChangeSummaryItem extends ChatBaseItem {
  branch: string | null;
  files: ChangeReviewFile[];
  kind: "change-summary";
  summary: string;
  title: string;
}

export interface ChatChangeReviewDiffItem extends ChatBaseItem {
  files: ChangeDiffFile[];
  kind: "change-review-diff";
  summary: string;
  title: string;
}

export interface ChatCheckpointUndoConfirmationItem extends ChatBaseItem {
  checkpoint: ChangeCheckpointSnapshot;
  files: ChangeReviewFile[];
  kind: "checkpoint-undo-confirmation";
  summary: string;
  title: string;
}

export interface ChatChangeRecoveryItem extends ChatBaseItem {
  kind: "change-recovery";
  recovery: ChangeRecoveryState;
}

export interface ChatBackgroundTaskItem extends ChatBaseItem {
  detail?: string;
  kind: "background-task";
  projectLabel?: string;
  status: BackgroundTaskStatus;
  summary: string;
  title: string;
}

export interface ChatOperatorRunItem extends ChatBaseItem {
  defaultOpen?: boolean;
  kind: "operator-run";
  run: OperatorRunSnapshot;
}

export type ChatItem =
  | ChatBackgroundTaskItem
  | ChatChangeRecoveryItem
  | ChatChangeReviewDiffItem
  | ChatChangeSummaryItem
  | ChatCheckpointUndoConfirmationItem
  | ChatCompactionNoticeItem
  | ChatCustomSurfaceItem
  | ChatErrorItem
  | ChatGitHubAutomationErrorItem
  | ChatGitHubAutomationReadyItem
  | ChatMessageItem
  | ChatOperatorRunItem
  | ChatRecoveryItem
  | ChatSubagentChainItem
  | ChatSummaryItem
  | ChatThinkingItem
  | ChatToolApprovalBlockedItem
  | ChatToolApprovalRequestItem
  | ChatToolActionItem
  | ChatVerificationSummaryItem;

export type RuntimeTranscriptEvent =
  | RuntimeAssistantMessageEvent
  | RuntimeBackgroundTaskEvent
  | RuntimeChangeRecoveryEvent
  | RuntimeChangeReviewDiffEvent
  | RuntimeChangeSummaryEvent
  | RuntimeCheckpointUndoConfirmationEvent
  | RuntimeCompactionEvent
  | RuntimeCustomEvent
  | RuntimeErrorEvent
  | RuntimeOperatorRunEvent
  | RuntimeRecoveryEvent
  | RuntimeSubagentChainEvent
  | RuntimeSummaryEvent
  | RuntimeThinkingEvent
  | RuntimeToolApprovalBlockedEvent
  | RuntimeToolApprovalRequestEvent
  | RuntimeToolEvent
  | RuntimeUserMessageEvent;

interface RuntimeTranscriptEventBase {
  costLabel?: string;
  id: string;
  sequence?: number;
  timestamp?: string;
  timestampLabel?: string;
}

export interface RuntimeUserMessageEvent extends RuntimeTranscriptEventBase {
  attachments?: ChatAttachment[];
  content: string;
  kind: "user-message";
}

export interface RuntimeAssistantMessageEvent extends RuntimeTranscriptEventBase {
  content: string;
  kind: "assistant-message";
  modelLabel?: string;
  providerLabel?: string;
  thinkingLevelLabel?: string;
}

export interface RuntimeToolEvent extends RuntimeTranscriptEventBase {
  commandLabel?: string;
  defaultOpen?: boolean;
  detail?: string;
  kind: "tool";
  path?: string;
  status: ChatRunStatus;
  summary?: string;
  title?: string;
  toolName?: ChatToolName;
  truncated?: boolean;
}

export interface RuntimeThinkingEvent extends RuntimeTranscriptEventBase {
  defaultOpen?: boolean;
  detail?: string;
  kind: "thinking";
  status: ChatRunStatus;
  summary?: string;
  title?: string;
}

export interface RuntimeSubagentChainEvent extends RuntimeTranscriptEventBase {
  agents: ChatSubagent[];
  defaultOpen?: boolean;
  kind: "subagent-chain";
  status: ChatRunStatus;
  summary?: string;
  title?: string;
}

export interface RuntimeCompactionEvent extends RuntimeTranscriptEventBase {
  detail?: string;
  kind: "compaction";
  status: Extract<ChatRunStatus, "complete" | "error" | "running">;
  summary?: string;
  title?: string;
}

export interface RuntimeCustomEvent extends RuntimeTranscriptEventBase {
  customType?: string;
  description?: string;
  detailLines?: string[];
  kind: "custom";
  status?: ChatRunStatus;
  title?: string;
}

export interface RuntimeErrorEvent extends RuntimeTranscriptEventBase {
  detail?: string;
  kind: "error";
  message?: string;
  title?: string;
}

export interface RuntimeToolApprovalRequestEvent extends RuntimeTranscriptEventBase {
  kind: "tool-approval-request";
  request: ToolApprovalRequest;
}

export interface RuntimeToolApprovalBlockedEvent extends RuntimeTranscriptEventBase {
  blocked: ToolApprovalBlockedState;
  kind: "tool-approval-blocked";
}

export interface RuntimeChangeSummaryEvent extends RuntimeTranscriptEventBase {
  branch: string | null;
  files: ChangeReviewFile[];
  kind: "change-summary";
  summary: string;
  title?: string;
}

export interface RuntimeChangeReviewDiffEvent extends RuntimeTranscriptEventBase {
  files: ChangeDiffFile[];
  kind: "change-review-diff";
  summary: string;
  title?: string;
}

export interface RuntimeCheckpointUndoConfirmationEvent extends RuntimeTranscriptEventBase {
  checkpoint: ChangeCheckpointSnapshot;
  files: ChangeReviewFile[];
  kind: "checkpoint-undo-confirmation";
  summary: string;
  title?: string;
}

export interface RuntimeChangeRecoveryEvent extends RuntimeTranscriptEventBase {
  kind: "change-recovery";
  recovery: ChangeRecoveryState;
}

export interface RuntimeBackgroundTaskEvent extends RuntimeTranscriptEventBase {
  detail?: string;
  kind: "background-task";
  projectLabel?: string;
  status: BackgroundTaskStatus;
  summary: string;
  title: string;
}

export interface RuntimeOperatorRunEvent extends RuntimeTranscriptEventBase {
  defaultOpen?: boolean;
  kind: "operator-run";
  run: OperatorRunSnapshot;
}

export interface RuntimeRecoveryEvent extends RuntimeTranscriptEventBase {
  actions?: ChatRecoveryAction[];
  detail?: string;
  kind: "recovery";
  message?: string;
  state: ChatRecoveryState;
  title?: string;
}

export interface RuntimeSummaryEvent extends RuntimeTranscriptEventBase {
  content: string;
  kind: "summary";
  summaryType: ChatSummaryItem["summaryType"];
  title: string;
}

export function normalizeRuntimeTranscriptEvents(
  events: RuntimeTranscriptEvent[]
): ChatItem[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      const leftSequence = left.event.sequence ?? left.index;
      const rightSequence = right.event.sequence ?? right.index;

      if (leftSequence === rightSequence) {
        return left.index - right.index;
      }

      return leftSequence - rightSequence;
    })
    .map(({ event }): ChatItem => normalizeRuntimeTranscriptEvent(event));
}

function normalizeRuntimeTranscriptEvent(event: RuntimeTranscriptEvent): ChatItem {
  switch (event.kind) {
    case "operator-run":
      return {
        costLabel: event.costLabel,
        defaultOpen: event.defaultOpen,
        id: event.id,
        kind: "operator-run",
        run: event.run,
        timestampLabel: event.timestampLabel
      };
    case "background-task":
      return {
        costLabel: event.costLabel,
        detail: event.detail,
        id: event.id,
        kind: "background-task",
        projectLabel: event.projectLabel,
        status: event.status,
        summary: event.summary,
        timestampLabel: event.timestampLabel,
        title: event.title
      };
    case "assistant-message":
      return {
        content: event.content,
        costLabel: event.costLabel,
        id: event.id,
        kind: "assistant-message",
        modelLabel: event.modelLabel,
        providerLabel: event.providerLabel,
        thinkingLevelLabel: event.thinkingLevelLabel,
        timestampLabel: event.timestampLabel
      };
    case "compaction":
      return {
        costLabel: event.costLabel,
        detail: event.detail,
        id: event.id,
        kind: "compaction-notice",
        status: event.status,
        summary: event.summary ?? "Context compaction event.",
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Context compaction"
      };
    case "custom":
      return {
        costLabel: event.costLabel,
        customType: event.customType ?? "runtime-extension",
        description: event.description ?? "Runtime emitted an extension payload.",
        detailLines: event.detailLines,
        id: event.id,
        kind: "custom-surface",
        status: event.status,
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Runtime extension"
      };
    case "error":
      return {
        costLabel: event.costLabel,
        detail: event.detail,
        id: event.id,
        kind: "error",
        message: event.message ?? "Runtime reported an error.",
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Runtime error"
      };
    case "recovery":
      return {
        actions: event.actions,
        costLabel: event.costLabel,
        detail: event.detail,
        id: event.id,
        kind: "recovery",
        message: event.message ?? getDefaultRecoveryMessage(event.state),
        state: event.state,
        timestampLabel: event.timestampLabel,
        title: event.title ?? getDefaultRecoveryTitle(event.state)
      };
    case "subagent-chain":
      return {
        agents: event.agents,
        costLabel: event.costLabel,
        defaultOpen: event.defaultOpen,
        id: event.id,
        kind: "subagent-chain",
        status: event.status,
        summary: event.summary,
        timestampLabel: event.timestampLabel,
        title: event.title ?? `subagent chain (${event.agents.length})`
      };
    case "summary":
      return {
        content: event.content,
        costLabel: event.costLabel,
        id: event.id,
        kind: "summary",
        summaryType: event.summaryType,
        timestampLabel: event.timestampLabel,
        title: event.title
      };
    case "thinking":
      return {
        costLabel: event.costLabel,
        defaultOpen: event.defaultOpen,
        detail: event.detail ?? "Runtime thinking detail is not available.",
        id: event.id,
        kind: "thinking",
        status: event.status,
        summary: event.summary ?? "Runtime thinking event.",
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Thinking"
      };
    case "tool":
      return {
        commandLabel: event.commandLabel,
        costLabel: event.costLabel,
        defaultOpen: event.defaultOpen,
        detail: event.detail,
        id: event.id,
        kind: "tool-action",
        path: event.path,
        status: event.status,
        summary: event.summary ?? "Runtime tool event.",
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Runtime tool",
        toolName: event.toolName ?? "runtime",
        truncated: event.truncated
      };
    case "tool-approval-blocked":
      return {
        blocked: event.blocked,
        costLabel: event.costLabel,
        id: event.id,
        kind: "tool-approval-blocked",
        timestampLabel: event.timestampLabel
      };
    case "tool-approval-request":
      return {
        costLabel: event.costLabel,
        id: event.id,
        kind: "tool-approval-request",
        request: event.request,
        timestampLabel: event.timestampLabel
      };
    case "change-summary":
      return {
        branch: event.branch,
        costLabel: event.costLabel,
        files: event.files,
        id: event.id,
        kind: "change-summary",
        summary: event.summary,
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Change summary"
      };
    case "change-review-diff":
      return {
        costLabel: event.costLabel,
        files: event.files,
        id: event.id,
        kind: "change-review-diff",
        summary: event.summary,
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Change review"
      };
    case "checkpoint-undo-confirmation":
      return {
        checkpoint: event.checkpoint,
        costLabel: event.costLabel,
        files: event.files,
        id: event.id,
        kind: "checkpoint-undo-confirmation",
        summary: event.summary,
        timestampLabel: event.timestampLabel,
        title: event.title ?? "Undo checkpoint"
      };
    case "change-recovery":
      return {
        costLabel: event.costLabel,
        id: event.id,
        kind: "change-recovery",
        recovery: event.recovery,
        timestampLabel: event.timestampLabel
      };
    case "user-message":
      return {
        attachments: event.attachments,
        content: event.content,
        costLabel: event.costLabel,
        id: event.id,
        kind: "user-message",
        timestampLabel: event.timestampLabel
      };
  }
}

function getDefaultRecoveryTitle(state: ChatRecoveryState): string {
  switch (state) {
    case "aborted":
      return "Run aborted";
    case "failed":
      return "Run failed";
    case "resumed":
      return "Session resumed";
    case "stopped":
      return "Run stopped";
  }
}

function getDefaultRecoveryMessage(state: ChatRecoveryState): string {
  switch (state) {
    case "aborted":
      return "The run ended before it could finish.";
    case "failed":
      return "The run failed, but the prior transcript remains available.";
    case "resumed":
      return "The session was restored and can continue from the latest transcript.";
    case "stopped":
      return "The run was stopped by the user.";
  }
}
